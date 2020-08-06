const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const dynamodbDao = require('dynamodb-dao');

const UITESTER_S3_BUCKET_NAME = process.env.UITESTER_S3_BUCKET_NAME;
const UITESTER_DYNAMODB_TABLE_NAME = process.env.UITESTER_DYNAMODB_TABLE_NAME;

exports.lambda_handler = async (event, context) => {

  const resultSetId = event.pathParameters.resultSetId;

  // Result一覧を取得
  const resultList = await dynamodbDao.query(
    dynamoDB,
    {
      TableName: UITESTER_DYNAMODB_TABLE_NAME,
      IndexName: "ResultSearchIndex",
      KeyConditionExpression: "ResultSetId=:resultSetId",
      ExpressionAttributeValues: {
        ":resultSetId": resultSetId
      }
    }
  );

  // Result関連リソースの削除
  for(const result of resultList.Items) {

    if (result.S3ObjectKey) {
      // S3のObjが存在する場合は削除
      await S3.deleteObject({
        Bucket: UITESTER_S3_BUCKET_NAME,
        Key: result.S3ObjectKey
      }).promise();
    }

    // Resultの削除
    // TODO 最終的にはBatchWriteItemを利用した一括バッチ処理に変更
    await dynamodbDao.delete(
      dynamoDB,
      {
        TableName: UITESTER_DYNAMODB_TABLE_NAME,
        Key: {　"Id": result.Id　}
      }
    );
  }
  
  // ResultSetの削除
  await dynamodbDao.delete(
    dynamoDB,
    {
      TableName: UITESTER_DYNAMODB_TABLE_NAME,
      Key: {　"Id": resultSetId　}
    }
  );

  var response = {
    'statusCode': 200,
    'headers': {
      "Access-Control-Allow-Headers" : "*",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS, GET"
    },
    'body': JSON.stringify({
      message: resultList.Items,
    })
  }
  return response
}