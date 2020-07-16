const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const dynamodbDao = require('dynamodb-dao');

const UITESTER_DYNAMODB_TABLE_NAME = process.env.UITESTER_DYNAMODB_TABLE_NAME;

exports.lambda_handler = async (event, context) => {
  const resultSetList = await dynamodbDao.scan(
    dynamoDB,
    {
      TableName: UITESTER_DYNAMODB_TABLE_NAME,
      FilterExpression: "begins_with(Id, :result_sets_prefix)",
      ExpressionAttributeValues: {
        ":result_sets_prefix": "Result-Set-"
      }
    }
  );

  var response = {
    'statusCode': 200,
    'body': JSON.stringify({
      message: resultSetList.Items,
    })
  }
  return response
}