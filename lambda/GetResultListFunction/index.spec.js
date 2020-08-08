const AWS = require('aws-sdk');
const dynamoDbDao = require('dynamodb-dao');

// 環境変数の設定
process.env.UITESTER_DYNAMODB_TABLE_NAME = "dummy"

const getResultListFunction = require("./index");

// jestのマニュアルモック利用
jest.mock('dynamodb-dao');

describe('GetResultListFunction Success Group', () => {

  // beforeAll( async () => {
  //   console.log("beforeAll");
  // });

  beforeEach( async () => {
    // モック処理のリセット
    dynamoDbDao.query = async (dynamoDB, scanObj) => { 
      return []; 
    }
  });

  // Result一覧取得のユニットテスト
  test('index.js test', async () => {
    console.log("index.js test");

    // マニュアルモックの上書き
    dynamoDbDao.query = (dynamoDB, queryObj) => {
      return {
        Items: [ 
          { ResultName: 'TOP画面', ResultSetId: 'Result-Set-2', Id: 'query-test-object-2' },
          { ResultName: '詳細画面', ResultSetId: 'Result-Set-2', Id: 'query-test-object-3' }
        ],
        Count: 2,
        ScannedCount: 2
      };
    }

    const event = {
      pathParameters: {
        resultSetId: "Result-Set-2"
      }
    }
    const response = await getResultListFunction.lambda_handler(event);
    expect(JSON.parse(response.body).message).toEqual(
      [
        { ResultName: 'TOP画面', ResultSetId: 'Result-Set-2', Id: 'query-test-object-2' },
        { ResultName: '詳細画面', ResultSetId: 'Result-Set-2', Id: 'query-test-object-3' }
      ]
    );
  });

  // afterEach( async () => {
  // });

  // afterAll( async () => {
  //   console.log("afterAll");
  // });
});

describe('GetResultListFunction Error Group', () => {
  // 例外発生のユニットテスト
  test('index.js exception test', async () => {
    const response = await getResultListFunction.lambda_handler({});
    expect(response).toEqual({
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS, GET'
      },
      body: `{"message":"Cannot read property 'resultSetId' of undefined"}`
    });
  });
});