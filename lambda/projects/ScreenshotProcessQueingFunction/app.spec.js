const AWS = require('aws-sdk');
const config = {
  region: "ap-northeast-1",
  endpoint: "http://localhost:4566"  
}

// テスト対象のDI用コンポーネント作成
const SQS = new AWS.SQS(config);
const DYNAMODB = new AWS.DynamoDB.DocumentClient(config);
const diComponents = {
  SQS: SQS,
  DYNAMODB: DYNAMODB
};

// 環境変数の設定
process.env.UITESTER_SQS_QUEUE_NAME = "local-uitester"
process.env.SCREENSHOT_PROCESS_SQS = `${config.endpoint}/queue/local-uitester`
process.env.UITESTER_DYNAMODB_TABLE_NAME = "local-uitester"


const dynamoDB = new AWS.DynamoDB(config);

const screenshotProcessQueing = require("./app");

describe('ScreenshotProcessQueingFunction Success Group', () => {

  beforeAll( async () => {
    console.log("beforeAll");

    // DynamoDB テーブル作成
    await createTestTable();
    // SQS キュー作成
    await SQS.createQueue({QueueName: process.env.UITESTER_SQS_QUEUE_NAME}).promise();
  });

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
              "Id": "Result-2",
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

  afterAll( async () => {
    console.log("afterAll");
    // DynamoDB テーブル削除
    await deleteTestTable();
    // SQS キュー削除
    await SQS.deleteQueue({QueueUrl: process.env.SCREENSHOT_PROCESS_SQS}).promise();
  });
});

async function createTestTable() {
  var tableParams = {
    TableName: process.env.UITESTER_DYNAMODB_TABLE_NAME,
    AttributeDefinitions: [
      { AttributeName: 'Id', AttributeType: 'S'},
      { AttributeName: 'ResultSetId', AttributeType: 'S' },
      { AttributeName: 'ResultName', AttributeType: 'S' }
    ],
    KeySchema: [
      { AttributeName: 'Id', KeyType: 'HASH' }
    ],
    GlobalSecondaryIndexes: [{
      IndexName: "ResultSearchIndex",
      KeySchema: [
        { AttributeName: 'ResultSetId', KeyType: 'HASH' },
        { AttributeName: 'ResultName', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: "ALL" },
      ProvisionedThroughput: { ReadCapacityUnits: 2, WriteCapacityUnits: 2 }
    }],
    ProvisionedThroughput: { ReadCapacityUnits: 2, WriteCapacityUnits: 2 }
  };
  resp = await dynamoDB.createTable(tableParams).promise();
}

async function deleteTestTable() {
  const tableParams = { TableName: process.env.UITESTER_DYNAMODB_TABLE_NAME }
  await dynamoDB.deleteTable(tableParams).promise();
}