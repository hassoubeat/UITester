// アトミックカウンターのレコードキー
const RESULT_SET_COUNTER_ID = 'ResultSetIdCounter';
const RESULT_COUNTER_ID = 'ResultIdCounter';

// データ登録
module.exports.put = async (dynamoDB, putObj) => {
  const date = lib.getNowTime();
  putObj.Item.CreateDate = date.toLocaleString({timeZone: 'Asia/Tokyo'});
  putObj.Item.UnixCreateDate = date.getTime();
  console.log(putObj);
  return await dynamoDB.put(putObj).promise();
}

// データ更新
module.exports.update = async (dynamoDB, updateObj) => {
  return await dynamoDB.update(updateObj).promise();
}

// データ検索
module.exports.query = async (dynamoDB, queryObj) => {
  return await dynamoDB.query(queryObj).promise();
}

// データスキャン
module.exports.scan = async (dynamoDB, scanObj) => {
  return await dynamoDB.scan(scanObj).promise();
}

// データ削除
module.exports.delete = async (dynamoDB, deleteObj) => {
  return await dynamoDB.delete(deleteObj).promise();
}
  
// ResultSet用の現在のアトミックカウンターからインクリメントした値を取得
module.exports.getResultSetId = async (dynamoDB, tableName) => {
  return await incrementeAtomicCounter(dynamoDB, tableName, RESULT_SET_COUNTER_ID);
}

// Result用の現在のアトミックカウンターからインクリメントした値を取得
module.exports.getResultId = async (dynamoDB, tableName) => {
  return await incrementeAtomicCounter(dynamoDB, tableName, RESULT_COUNTER_ID);
}

// アトミックカウンター更新処理
async function incrementeAtomicCounter(dynamoDB, tableName, id) {
  const result = await dynamoDB.update({
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

// 現在時刻の取得
function getNowTime() {
  return date = new Date();
}

// ユニットテストでモックする必要のあるモジュール内関数をラッピングしている
// 詳細はこちら https://medium.com/@qjli/how-to-mock-specific-module-function-in-jest-715e39a391f4
const lib = {
  getNowTime
};
module.exports.lib = lib;