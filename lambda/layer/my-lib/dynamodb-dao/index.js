const AWS = require('aws-sdk');
const DYNAMODB = new AWS.DynamoDB.DocumentClient();

const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

// アトミックカウンターのレコードキー
const RESULT_SET_COUNTER_ID = 'ResultSetIdCounter';
const RESULT_COUNTER_ID = 'ResultIdCounter';

// データ登録
module.exports.put = async (item) => {
  return await DYNAMODB.put({
    TableName: DYNAMODB_TABLE_NAME,
    Item: item
  }).promise();
}
  
// ResultSet用の現在のアトミックカウンターからインクリメントした値を取得
module.exports.getResultSetId = async () => {
  return await incrementeAtomicCounter(RESULT_SET_COUNTER_ID);
}

// Result用の現在のアトミックカウンターからインクリメントした値を取得
module.exports.getResultId = async () => {
  return await incrementeAtomicCounter(RESULT_COUNTER_ID);
}

// アトミックカウンター更新処理
async function incrementeAtomicCounter(id) {
  const result = await DYNAMODB.update({
    TableName: DYNAMODB_TABLE_NAME,
    Key: {
       Id: id
    },
    UpdateExpression: 'ADD IdCounter :Increment',
    ExpressionAttributeValues: {
       ':Increment': 1
    },
    ReturnValues: 'UPDATED_NEW'
 }).promise();
  return result.Attributes.IdCounter;
}