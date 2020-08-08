const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const dynamodbDao = require('dynamodb-dao');

const UITESTER_DYNAMODB_TABLE_NAME = process.env.UITESTER_DYNAMODB_TABLE_NAME;

// レスポンス変数の定義
var response = {
  'statusCode': 200,
  'headers': {
    "Access-Control-Allow-Headers" : "*",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, GET"
  }
}

exports.lambda_handler = async (event, context) => {

  try {
    const resultSetId = event.pathParameters.resultSetId;

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

    response.body = JSON.stringify({
      message: resultList.Items,
    });

  } catch (error) {
    console.error(error);

    response.statusCode = 500;
    response.body = JSON.stringify({
      message: error.message
    });

  } finally {
    return response;
  }
}