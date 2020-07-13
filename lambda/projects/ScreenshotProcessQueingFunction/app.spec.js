const AWS = require('aws-sdk');

// テスト対象のDI用コンポーネント作成
const SQS = new AWS.SQS();
const DYNAMODB = new AWS.DynamoDB.DocumentClient();
const diComponents = {
  SQS: SQS,
  DYNAMODB: DYNAMODB
};

// 環境変数の設定
process.env.UITESTER_SQS_QUEUE_NAME = "dummy"
process.env.SCREENSHOT_PROCESS_SQS = `dummy`
process.env.UITESTER_DYNAMODB_TABLE_NAME = "dummy"

const screenshotProcessQueing = require("./app");

// jestのマニュアルモック
jest.mock('dynamodb-dao');

// DIで利用する処理をスタブ化
diComponents.SQS.sendMessage =  () => {
  return {
    promise: () => {
      return {status: 200}
    }
  }
}

describe('ScreenshotProcessQueingFunction Success Group', () => {

  // beforeAll( async () => {
  //   console.log("beforeAll");
  // });

  // beforeEach( async () => {
  // });

  test('app.js test', async () => {
    console.log("app.js test");

    // POSTデータの読み込み
    const inputData = require('./post-datas/project-queing-data.json');
    const event = {body: JSON.stringify(inputData)};
    const response = await screenshotProcessQueing({diComponents, event});
    expect(JSON.parse(response.body).message).toEqual({
      "Result-Set-1": {
          "Action-1": {
              "Id": "Result-1",
              "Progress": "未処理",
              "ResultName": "iPhone 6(横)",
              "ResultSetId": "Result-Set-1",
              "Type": "SCREENSHOT"
          },
          "Action-2": {
              "Id": "Result-1",
              "Progress": "未処理",
              "ResultName": "iPhone 6(縦)",
              "ResultSetId": "Result-Set-1",
              "Type": "SCREENSHOT"
          }
      }
    });
  });

  // afterEach( async () => {
  // });

  // afterAll( async () => {
  //   console.log("afterAll");
  // });
});