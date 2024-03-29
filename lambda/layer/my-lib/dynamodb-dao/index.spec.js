const AWS = require('aws-sdk');
const config = {
  region: "ap-northeast-1",
  endpoint: "http://localhost:4566"  
}

const dynamoDB = new AWS.DynamoDB(config);
const dynamoDbDocumentClient = new AWS.DynamoDB.DocumentClient(config);
const uitesterTableName = "local-uitester";

const dynamoDao = require("./index");

describe('DynamoDB Dao Success Group', () => {

  beforeAll( async () => {
    console.log("beforeAll");

    // テーブル作成
    await createTestTable();
    // 初期データ投入
    const testObj1 = {
      TableName: uitesterTableName,
      Item: { Id: "get-test-object-1" }
    }
    const testObj2 = {
      TableName: uitesterTableName,
      Item: { Id: "get-test-object-2" }
    }
    const testObj3 = {
      TableName: uitesterTableName,
      Item: { Id: "other-test-object-1" }
    }
    const testObj4 = {
      TableName: uitesterTableName,
      Item: { 
        Id: "query-test-object-1",
        ResultSetId: "Result-Set-1",
        ResultName: "TOP画面"
      }
    }
    const testObj5 = {
      TableName: uitesterTableName,
      Item: { 
        Id: "query-test-object-2",
        ResultSetId: "Result-Set-2",
        ResultName: "TOP画面"
      }
    }
    const testObj6 = {
      TableName: uitesterTableName,
      Item: { 
        Id: "query-test-object-3",
        ResultSetId: "Result-Set-2",
        ResultName: "詳細画面"
      }
    }
    await dynamoDbDocumentClient.put(testObj1).promise();
    await dynamoDbDocumentClient.put(testObj2).promise();
    await dynamoDbDocumentClient.put(testObj3).promise();
    await dynamoDbDocumentClient.put(testObj4).promise();
    await dynamoDbDocumentClient.put(testObj5).promise();
    await dynamoDbDocumentClient.put(testObj6).promise();
  });

  // beforeEach( async () => {
  // });

  // データ投入(put)のテスト
  test('dynamoDao put test', async () => {
    console.log("dynamoDao put test");

    // 日付取得処理を固定
    dynamoDao.lib.getNowTime = jest.fn(() => new Date("2020/1/1 13:59:59"));

    const resultSetId = "Result-Set-1";
    const response = await dynamoDao.put(
      dynamoDbDocumentClient,
      {
        TableName: uitesterTableName,
        Item: {
          Id: resultSetId,
          Type: 'SCREENSHOT',
          ResultSetName: "Result-Set-1"
        }
      }
    );
    expect(response).toEqual({"ConsumedCapacity":{"TableName":uitesterTableName,"CapacityUnits":1}});

    // 投入されたデータを取得して期待通りの値になっているかチェック
    checkPutObj = await getColumn(resultSetId);
    console.log(checkPutObj);
    expect(checkPutObj.Item).toEqual({
      Id: resultSetId,
      Type: 'SCREENSHOT',
      ResultSetName: "Result-Set-1",
      CreateDate: "2020/1/1 13:59:59",
      UnixCreateDate: 1577854799000
    });

    // 投入したデータを削除
    await deleteColumn(resultSetId);
  });

  // データスキャン(scan)のテスト
  test('dynamoDao scan test', async () => {
    console.log("dynamoDao scan test");
    const response = await dynamoDao.scan(
      dynamoDbDocumentClient,
      {
        TableName: uitesterTableName,
        FilterExpression: "begins_with(Id, :result_sets_prefix)",
        ExpressionAttributeValues: {
          ":result_sets_prefix": "get-test-"
        }
      }
    );
    expect(response).toEqual(
      {
        Items: [ { Id: 'get-test-object-2' }, { Id: 'get-test-object-1' } ],
        Count: 2,
        ScannedCount: 6
      }
    );
  });

  // データ検索(query)のテスト
  test('dynamoDao query test', async () => {
    console.log('dynamoDao query test');
    const response = await dynamoDao.query(
      dynamoDbDocumentClient,
      {
        TableName: uitesterTableName,
        IndexName: "ResultSearchIndex",
        KeyConditionExpression: "ResultSetId=:resultSetId",
        ExpressionAttributeValues: {
          ":resultSetId": "Result-Set-2"
        }
      }
    );
    expect(response).toEqual(
      {
        Items: [ 
          { ResultName: 'TOP画面', ResultSetId: 'Result-Set-2', Id: 'query-test-object-2' },
          { ResultName: '詳細画面', ResultSetId: 'Result-Set-2', Id: 'query-test-object-3' }
        ],
        Count: 2,
        ScannedCount: 2
      }
    );
  });

  // データ検索(delete)のテスト
  test('dynamoDao delete test', async () => {
    console.log('dynamoDao delete test');

    // 削除テスト用データの登録
    const deleteTestObj = {
      TableName: uitesterTableName,
      Item: {  Id: "delete-test-obj" }
    }
    await dynamoDbDocumentClient.put(deleteTestObj).promise();

    // 削除するデータがあることを確認
    expect(await getColumn(deleteTestObj.Item.Id)).toEqual({
      "Item": { "Id": "delete-test-obj" }
    });

    // 登録したデータを削除
    await dynamoDao.delete(
      dynamoDbDocumentClient,
      {
        TableName: uitesterTableName,
        Key: {　"Id": deleteTestObj.Item.Id　}
      }
    );
    // 削除後のデータがないことを確認
    expect(await getColumn(deleteTestObj.Item.Id)).toEqual({});
  });

  // ResultSetId(アトミックカウンター)取得処理のテスト
  test('dynamoDao getResultSetId test', async () => {
    console.log("dynamoDao getResultSetId test");
    const response = await dynamoDao.getResultSetId(dynamoDbDocumentClient, uitesterTableName);
    expect(response).toBe(1);
  });

  // ResultId(アトミックカウンター)取得処理のテスト
  test('dynamoDao getResultId test', async () => {
    console.log("dynamoDao getResultId test");
    const response = await dynamoDao.getResultId(dynamoDbDocumentClient, uitesterTableName);
    expect(response).toBe(1);
  });

  // afterEach( async () => {
  // });

  afterAll( async () => {
    console.log("afterAll");
    await deleteTestTable();
  });
});

async function createTestTable() {
  var tableParams = {
    TableName: uitesterTableName,
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
  const tableParams = { TableName: uitesterTableName }
  await dynamoDB.deleteTable(tableParams).promise();
}

async function getColumn(id) {
  const getParams = { 
    TableName: uitesterTableName,
    Key: { Id : id }
  }
  return await dynamoDbDocumentClient.get(getParams).promise();
}

async function deleteColumn(id) {
  const deleteParams = { 
    TableName: uitesterTableName,
    Key:{ Id: id }
  }
  await dynamoDbDocumentClient.delete(deleteParams).promise();
}