const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const dynamodbDao = require('dynamodb-dao');

const UITESTER_DYNAMODB_TABLE_NAME = process.env.UITESTER_DYNAMODB_TABLE_NAME;

exports.lambda_handler = async (event, context) => {

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

  var response = {
    'statusCode': 200,
    'body': JSON.stringify({
      message: resultList.Items,
    })
  }
  return response
}