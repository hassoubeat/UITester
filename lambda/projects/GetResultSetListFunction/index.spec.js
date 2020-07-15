const AWS = require('aws-sdk');
const dynamoDbDao = require('dynamodb-dao');

// 環境変数の設定
process.env.UITESTER_DYNAMODB_TABLE_NAME = "dummy"

const getResultSetListFunction = require("./index");
const { ManagedBlockchain } = require('aws-sdk');

// jestのマニュアルモック利用
jest.mock('dynamodb-dao');

describe('ScreenshotProcessQueingFunction Success Group', () => {

  // beforeAll( async () => {
  //   console.log("beforeAll");
  // });

  beforeEach( async () => {
    // モック処理のリセット
    dynamoDbDao.scan = async (dynamoDB, scanObj) => {
      return {
        Items: [],
        Count: 0,
        ScannedCount: 0
      };
    }
  });

  // ResultSet一覧取得のユニットテスト
  test('index.js test', async () => {
    console.log("index.js test");

    // マニュアルモックの上書き
    dynamoDbDao.scan = (dynamoDB, scanObj) => {
      return {
        Items: [ { Id: 'get-test-object-2' }, { Id: 'get-test-object-1' } ],
        Count: 2,
        ScannedCount: 3
      };
    }

    const event = {}
    const response = await getResultSetListFunction.lambda_handler({event});
    expect(JSON.parse(response.body).message).toEqual(
      [{ Id: 'get-test-object-2' }, { Id: 'get-test-object-1' }]
    );
  });

  // モックの処理が元に戻っているかチェックするテスト
  test('index.js test2', async () => {
    const event = {}
    const response = await getResultSetListFunction.lambda_handler({event});
    expect(JSON.parse(response.body).message).toEqual(
      []
    );
  });

  // afterEach( async () => {
  // });

  // afterAll( async () => {
  //   console.log("afterAll");
  // });
});