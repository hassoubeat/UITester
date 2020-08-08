const AWS = require('aws-sdk');
const dynamoDbDocumentClient = new AWS.DynamoDB.DocumentClient();
const dynamodbDao = require('dynamodb-dao');

const UITESTER_DYNAMODB_TABLE_NAME = process.env.UITESTER_DYNAMODB_TABLE_NAME;

exports.lambda_handler = async (event, context) => {

  try {
    const diffPayload = JSON.parse(event['Records'][0]['body']);

    // DynamoDBのステータス更新
    await dynamodbDao.update(
      dynamoDbDocumentClient,
      {
        TableName: UITESTER_DYNAMODB_TABLE_NAME,
        Key: { Id : diffPayload.resultId },
        UpdateExpression: "Set Progress=:progress, ErrorMessage=:errorMessage",
        ExpressionAttributeValues: {
          ":progress": "エラー",
          ":errorMessage": "Lambda run time exceeded."
        }
      }
    );
  } catch(error) {
    console.error(error);
  }
}