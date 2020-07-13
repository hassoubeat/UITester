/* 日本語フォントが入っている.fontsを読み込ませるためにHOMEを設定する */
process.env['HOME'] = '/opt/nodejs/';

const AWS = require('aws-sdk');
const chromium = require('chrome-aws-lambda');
const puppeteer = chromium.puppeteer;

const S3 = new AWS.S3();
const SAVE_BUCKET_NAME = process.env['S3_BUCKET_NAME']

const dynamodbDao = require('dynamodb-dao');
const dynamoDbDocumentClient = new AWS.DynamoDB.DocumentClient();
const UITESTER_DYNAMODB_TABLE_NAME = process.env['UITESTER_DYNAMODB_TABLE_NAME'];

// メイン処理
exports.lambda_handler = async (event, context) => {
  try {
    var action = JSON.parse(event['Records'][0]['body']);

    // Pupperteer初期処理
    var browser = await puppeteer.launch({
      args: chromium.args.concat(['--lang=ja']),
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });
    let page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ja-JP'
    });

    // Pupperteerのブラウザの詳細設定を実行
    page = await browserSetting(page, action.browserSettings);

    for(let actionProcess of action.actionProcesies) {
      // Pupperteerのブラウザを操作
      await browserAction(page, actionProcess);
    };
    
    // スクリーンショット取得
    const screenshot = await page.screenshot(action.screenshotOptions);
    
    // S3にスクリーンショット保存
    const s3PutParams = {
      Bucket: SAVE_BUCKET_NAME,
      Key: `result/${action.resultSetId}/${action.actionName}.png`,
      Body: screenshot,
      ContentType: 'image/png'
    }
    await S3.putObject(s3PutParams).promise();

    // 保存後にDynamoDBのステータス更新
    await dynamodbDao.update(
      dynamoDbDocumentClient,
      {
        TableName: UITESTER_DYNAMODB_TABLE_NAME,
        Key: { Id : action.resultId },
        UpdateExpression: "Set Progress=:progress, S3ObjectKey=:s3ObjectKey",
        ExpressionAttributeValues: {
          ":progress": "処理済",
          ":s3ObjectKey": s3PutParams.Key
        }
      }
    );
    
  } catch (error) {
    // エラー発生時、DynamoDBのステータス更新

    // 保存後にDynamoDBのステータス更新
    await dynamodbDao.update(
      dynamoDbDocumentClient,
      {
        TableName: UITESTER_DYNAMODB_TABLE_NAME,
        Key: { Id : action.resultId },
        UpdateExpression: "Set Progress=:progress, ErrorMessage=:errorMessage",
        ExpressionAttributeValues: {
          ":progress": "エラー",
          ":errorMessage": error.message
        }
      }
    );

    return context.fail(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};

 // ブラウザ設定
async function browserSetting(page, browserSettings) {
  if (browserSettings.deviceType) {
    const device = puppeteer.devices[browserSettings.deviceType]; 
    await page.emulate(device);
  } else {
    await page.setUserAgent(browserSettings.userAgent);
    await page.setViewport(browserSettings.viewport);
  }
  return page;
}

// ブラウザ操作
async function browserAction(page, actionProcess) {
  console.log(actionProcess);

  // アクション種別
  const GOTO = 'GOTO'; // ページ移動
  const WAIT = 'WAIT'; // 待機
  const CLICK = 'CLICK'; // ページクリック
  const FOCUS = 'FOCUS'; // フォーカス
  const INPUT = 'INPUT'; // 入力

  switch (actionProcess.processType) {
    case GOTO: {
      console.log('switch ' + GOTO);
      await page.goto(actionProcess.url);
      break;
    }
    case WAIT: {
      console.log('switch ' + WAIT);
      await page.waitFor(actionProcess.millisecond);
      break;
    }
    case FOCUS: {
      console.log('switch ' + FOCUS);
      await page.focus(actionProcess.selector);
      break;
    }
    case CLICK: {
      console.log('switch ' + CLICK);
      await page.click(actionProcess.selector);
      break;
    }
    case INPUT: {
      console.log('switch ' + INPUT);
      await page.type(actionProcess.selector, actionProcess.value);
      break;
    }
    default:
      console.log('switch default');
    }
}