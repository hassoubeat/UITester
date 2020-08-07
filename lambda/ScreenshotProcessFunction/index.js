/* 日本語フォントが入っている.fontsを読み込ませるためにHOMEを設定する */
process.env['HOME'] = '/opt/nodejs/';

const AWS = require('aws-sdk');
const chromium = require('chrome-aws-lambda');
const puppeteer = chromium.puppeteer;

const S3 = new AWS.S3();
const UITESTER_S3_BUCKET_NAME = process.env.UITESTER_S3_BUCKET_NAME;

const dynamodbDao = require('dynamodb-dao');
const dynamoDbDocumentClient = new AWS.DynamoDB.DocumentClient();
const UITESTER_DYNAMODB_TABLE_NAME = process.env.UITESTER_DYNAMODB_TABLE_NAME;

// メイン処理
exports.lambda_handler = async (event, context) => {
  try {
    var action = JSON.parse(event['Records'][0]['body']);

    // Puppeteer初期処理
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

    // Puppeteerのブラウザの詳細設定を実行
    page = await browserSetting(page, action.browserSettings);

    for(let actionProcess of action.actionProcesies) {
      // Puppeteerのブラウザを操作
      await browserAction(page, actionProcess);
    };
    
    // スクリーンショット取得
    const screenshot = await page.screenshot(action.screenshotOptions);
    
    // S3にスクリーンショット保存
    const s3PutParams = {
      Bucket: UITESTER_S3_BUCKET_NAME,
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
    console.error(error.message);

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
    if (browserSettings.userAgent) await page.setUserAgent(browserSettings.userAgent);
    if (browserSettings.viewport) await page.setViewport(browserSettings.viewport);
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
  const SCROLL = 'SCROLL'; // スクロール
  const AUTO_SCROLL = 'AUTO_SCROLL'; // 自動スクロール

  switch (actionProcess.processType) {
    case GOTO: {
      console.log('switch ' + GOTO);
      if (actionProcess.basicAuth) {
        await page.authenticate(actionProcess.basicAuth);
      }
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
    case SCROLL: {
      console.log('switch ' + SCROLL);
      await scroll(page, actionProcess.distance.xPixel, actionProcess.distance.yPixel);
      break;
    }
    case AUTO_SCROLL: {
      console.log('switch ' + AUTO_SCROLL);
      await autoScroll(page);
      break;
    }
    default:
      console.log('switch default');
    }
}

// puppeteerのスクロール処理
async function scroll(page, xPixel=0, yPixel=0){
  await page.evaluate(async (xPixel, yPixel) => {
    window.scrollBy(xPixel, yPixel);
  }, xPixel, yPixel);
}

// 【TODO】【beta】puppeteerの自動スクロール処理
// 0.1秒毎に100ピクセルずつ画面下部に当たるまでスクロールする
async function autoScroll(page){
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if(totalHeight >= scrollHeight){
            clearInterval(timer);
            resolve();
        }
      }, 100);
    });
  });
}