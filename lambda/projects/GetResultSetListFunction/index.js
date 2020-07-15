const AWS = require('aws-sdk');
const dynamodbDao = require('dynamodb-dao');

const UITESTER_DYNAMODB_TABLE_NAME = process.env.UITESTER_DYNAMODB_TABLE_NAME;

exports.lambda_handler = async (event, context) => {
  // TODO DynamoDBからScan & FilterでResultSetId一覧を取得

  var response = {
    'statusCode': 200,
    'body': JSON.stringify({
      message: "test",
    })
  }
  return response
}