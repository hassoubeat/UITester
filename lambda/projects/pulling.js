const AWS = require('aws-sdk');
const chromium = require('chrome-aws-lambda');
const puppeteer = chromium.puppeteer;

const S3 = new AWS.S3();
const SAVE_BUCKET_NAME = process.env['S3_BUCKET_NAME']

// 処理サイクル
const GOTO = 'GOTO';
const WAIT = 'WAIT';
const CLICK = 'CLICK';
const FOCUS = 'FOCUS';
const INPUT = 'INPUT';

// メイン処理
exports.lambda_handler = async (event, context) => {
  let browser = null;

  try {
    let action = JSON.parse(event['Records'][0]['body']);
    console.log(action);

    // 初期処理
    browser = await puppeteer.launch({
      args: chromium.args.concat(['--lang=ja']),
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    let page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ja-JP'
    });

    // ブラウザ操作
    const iPhone = puppeteer.devices['iPhone 6'];
    await page.emulate(iPhone);
    
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
    
    await page.emulate(iPhone);
    
    // const screenshot = await page.screenshot({fullPage:true});
    const screenshot = await page.screenshot();
    
    console.log(screenshot);
    
    params = {
      Bucket: SAVE_BUCKET_NAME,
      Key: `result/${action.actionId}.png`,
      Body: screenshot,
      ContentType: 'image/png'
    }
    result = await S3.putObject(params).promise();

    console.log(result);
    
  } catch (error) {
    return context.fail(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};