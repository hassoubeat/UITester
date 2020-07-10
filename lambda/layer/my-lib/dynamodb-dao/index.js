const AWS = require('aws-sdk');
const DYNAMODB = new AWS.DynamoDB.DocumentClient();

// アトミックカウンターのレコードキー
const RESULT_SET_COUNTER_ID = 'ResultSetIdCounter';
const RESULT_COUNTER_ID = 'ResultIdCounter';

// データ登録
module.exports.put = async (putObj) => {
  return await DYNAMODB.put(putObj).promise();
}

// データ更新
module.exports.update = async (updateObj) => {
  return await DYNAMODB.update(updateObj).promise();
}

// データ検索
module.exports.query = async (queryObj) => {
  return await DYNAMODB.query(queryObj).promise();
}
  
// ResultSet用の現在のアトミックカウンターからインクリメントした値を取得
module.exports.getResultSetId = async (tableName) => {
  return await incrementeAtomicCounter(tableName, RESULT_SET_COUNTER_ID);
}

// Result用の現在のアトミックカウンターからインクリメントした値を取得
module.exports.getResultId = async (tableName) => {
  return await incrementeAtomicCounter(tableName, RESULT_COUNTER_ID);
}

// アトミックカウンター更新処理
async function incrementeAtomicCounter(tableName, id) {
  const result = await DYNAMODB.update({
    TableName: tableName,
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