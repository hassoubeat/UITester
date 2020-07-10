const dynamoDao = require("./index");

const AWS = require('aws-sdk');
const config = {
  region: "ap-northeast-1",
  endpoint: "http://localhost:4566"  
}

const dynamoDB = new AWS.DynamoDB(config);
const dynamoDbDocumentClient = new AWS.DynamoDB.DocumentClient(config);
const uitesterTableName = "local-uitester";

describe('DynamoDB Dao Success Group', () => {

  beforeAll( async () => {
    console.log("beforeAll");

    // テーブル作成
    await createTestTable();
    // 初期データ投入
    const forGetTestObj = {
      TableName: uitesterTableName,
      Item: { Id: "for-get-test-object" }
    }
    await dynamoDbDocumentClient.put(forGetTestObj).promise();
  });

  // beforeEach( async () => {
  // });

  test('dynamoDao put test', async () => {
    console.log("dynamoDao put test");
    const response = await dynamoDao.put(
      dynamoDbDocumentClient,
      {
        TableName: uitesterTableName,
        Item: {
          Id: "Result-Set-1",
          Type: 'SCREENSHOT',
          ProjectName: "Project-1"
        }
      }
    );
    expect(response).toEqual({"ConsumedCapacity":{"TableName":uitesterTableName,"CapacityUnits":1}});
  });

  test('dynamoDao getResultSetId test', async () => {
    console.log("dynamoDao getResultSetId test");
    const response = await dynamoDao.getResultSetId(dynamoDbDocumentClient, uitesterTableName);
    expect(response).toBe(1);
  });

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