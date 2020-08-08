const AWS = require('aws-sdk');
const dynamoDbDao = require('dynamodb-dao');

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

const imageDiffProcessQueingFunction = require("./index");

describe('imageDiffProcessQueingFunctionFunction Success Group', () => {

  // beforeAll( async () => {
  //   console.log("beforeAll");
  // });

  beforeEach( async () => {
    // モック処理のリセット
    dynamoDbDao.query = async (dynamoDB, scanObj) => { 
      return []; 
    }
  });

  test('app.js test', async () => {
    console.log("app.js test");

    // マニュアルモックの上書き
    dynamoDbDao.query = (dynamoDB, queryObj) => {
      return {
        Items: [ 
          { Id: 'Result-1', ResultName: 'TOP画面', S3ObjectKey: '/result/Result-Set-1/TOP画面.png', ResultSetId: 'Result-Set-1', },
          { Id: 'Result-2', ResultName: '詳細画面', S3ObjectKey: '/result/Result-Set-1/詳細画面.png', ResultSetId: 'Result-Set-1', }
        ],
        Count: 2,
        ScannedCount: 2
      };
    }

    // POSTデータの読み込み
    const inputData = require('./post-datas/result-set-diff-queing-data.json');
    const event = {body: JSON.stringify(inputData)};
    const response = await imageDiffProcessQueingFunction.lambda_handler(event, {});
    expect(JSON.parse(response.body).message).toEqual({
      results: [
        {
          Id: 'Result-1',
          Type: 'SCREENSHOT_DIFF',
          ResultName: 'TOP画面',
          Progress: '未処理',
          OriginS3ObjectKey: '/result/Result-Set-1/TOP画面.png',
          TargetS3ObjectKey: '/result/Result-Set-1/TOP画面.png',
          ResultSetId: 'Result-Set-1'
        },
        {
          Id: 'Result-1',
          Type: 'SCREENSHOT_DIFF',
          ResultName: '詳細画面',
          Progress: '未処理',
          OriginS3ObjectKey: '/result/Result-Set-1/詳細画面.png',
          TargetS3ObjectKey: '/result/Result-Set-1/詳細画面.png',
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

describe('imageDiffProcessQueingFunctionFunction Error Group', () => {
  test('index.js exception test', async () => {
    // POSTデータの読み込み
    const event = {body: JSON.stringify()};
    const response = await imageDiffProcessQueingFunction.lambda_handler(event, {});
    expect(response).toEqual({
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS, POST'
      },
      body: `{"message":"Unexpected token u in JSON at position 0"}`
    });
  });
});