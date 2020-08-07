const AWS = require('aws-sdk');

// 環境変数の設定
process.env.UITESTER_SQS_QUEUE_NAME = "dummy"
process.env.SCREENSHOT_PROCESS_SQS = `dummy`
process.env.UITESTER_DYNAMODB_TABLE_NAME = "dummy"

// jestのマニュアルモック
jest.mock('dynamodb-dao');

// aws-sdkのモッキング
jest.mock('aws-sdk');
AWS.SQS = jest.fn(() => {
  return {
    sendMessage: jest.fn().mockImplementation(() => {
      return {
        promise: () => {
          return Promise.resolve({});
        }
      }
    }),
  };
});

const screenshotProcessQueing = require("./index");

describe('ScreenshotProcessQueingFunction Success Group', () => {

  // beforeAll( async () => {
  //   console.log("beforeAll");
  // });

  // beforeEach( async () => {
  // });

  test('app.js test', async () => {
    console.log("app.js test");

    // POSTデータの読み込み
    const inputData = require('./post-datas/queing-data.json');
    const event = {body: JSON.stringify(inputData)};
    const response = await screenshotProcessQueing.lambda_handler(event, {});
    expect(JSON.parse(response.body).message).toEqual({
      results: [
        {
          Id: 'Result-1',
          Type: 'SCREENSHOT',
          ResultName: 'SP_横画面_Googleトップページ',
          Progress: '未処理',
          ResultSetId: 'Result-Set-1'
        },
        {
          Id: 'Result-1',
          Type: 'SCREENSHOT',
          ResultName: 'SP_縦画面_Yahooトップページ',
          Progress: '未処理',
          ResultSetId: 'Result-Set-1'
        },
        {
          Id: 'Result-1',
          Type: 'SCREENSHOT',
          ResultName: 'PC_Basic認証テストページ',
          Progress: '未処理',
          ResultSetId: 'Result-Set-1'
        }
      ]
    });
  });

  // afterEach( async () => {
  // });

  // afterAll( async () => {
  //   console.log("afterAll");
  // });
});