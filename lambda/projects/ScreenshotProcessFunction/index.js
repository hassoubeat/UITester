/* 日本語フォントが入っている.fontsを読み込ませるためにHOMEを設定する */
process.env['HOME'] = '/opt/nodejs/';

const AWS = require('aws-sdk');
const chromium = require('chrome-aws-lambda');
const puppeteer = chromium.puppeteer;

const S3 = new AWS.S3();
const SAVE_BUCKET_NAME = process.env['S3_BUCKET_NAME']

const dynamodbDao = require('dynamodb-dao');

// 処理サイクル
const GOTO = 'GOTO';
const WAIT = 'WAIT';
const CLICK = 'CLICK';
const FOCUS = 'FOCUS';
const INPUT = 'INPUT';

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

    // ブラウザ設定
    const browserSettings = action.browserSettings
    if (browserSettings.deviceType) {
      const device = puppeteer.devices[browserSettings.deviceType]; 
      await page.emulate(device);
    } else {
      await page.setUserAgent(browserSettings.userAgent);
      await page.setViewport(browserSettings.viewport);
    }

    // ブラウザ操作
    for(let process of action.actionProcesies) {
      console.log(process);
      
      switch (process.processType) {
        case GOTO: {
          console.log('switch ' + GOTO);
          await page.goto(process.url);
          break;
        }
        case WAIT: {
          console.log('switch ' + WAIT);
          await page.waitFor(process.millisecond);
          break;
        }
        case FOCUS: {
          console.log('switch ' + FOCUS);
          await page.focus(process.selector);
          break;
        }
        case CLICK: {
          console.log('switch ' + CLICK);
          await page.click(process.selector);
          break;
        }
        case INPUT: {
          console.log('switch ' + INPUT);
          await page.type(process.selector, process.value);
          break;
        }
        default:
          console.log('switch default');
        }
    };
    
    // スクリーンショット取得
    const screenshot = await page.screenshot(action.screenshotOptions);
    
    // S3にスクリーンショット保存
    const s3PutParams = {
      Bucket: SAVE_BUCKET_NAME,
      Key: `result/${action.resultSetId}/${action.actionId}.png`,
      Body: screenshot,
      ContentType: 'image/png'
    }
    await S3.putObject(s3PutParams).promise();

    // 保存後にDynamoDBのステータス更新
    await dynamodbDao.update({
      Key: {
        Id : action.resultId
      },
      UpdateExpression: "Set Progress=:progress, S3ObjectKey=:s3ObjectKey",
      ExpressionAttributeValues: {
        ":progress": "処理済",
        ":s3ObjectKey": s3PutParams.Key
      }
    });
    
  } catch (error) {
    // エラー発生時、DynamoDBのステータス更新

    // 保存後にDynamoDBのステータス更新
    await dynamodbDao.update({
      Key: {
        Id : action.resultId
      },
      UpdateExpression: "Set Progress=:progress, ErrorMessage=:errorMessage",
      ExpressionAttributeValues: {
        ":progress": "エラー",
        ":errorMessage": error.message
      }
    });

    return context.fail(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};