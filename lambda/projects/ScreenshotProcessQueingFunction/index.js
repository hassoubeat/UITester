const AWS = require('aws-sdk');
const SQS = new AWS.SQS({apiVersion: '2012-11-05'});
const DYNAMODB = new AWS.DynamoDB.DocumentClient();

const SQS_QUEUE_URL = process.env.SCREENSHOT_PROCESS_SQS;
const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME

exports.lambda_handler = async (event, context) => {
  const payload = JSON.parse(event.body);
  console.log(payload);

  var result = {};

  // DynamoDBにメタデータ(Result-Set)の登録
  await DYNAMODB.put({
    TableName: DYNAMODB_TABLE_NAME,
    Item: {
      Id: 'Result-Set-1',
      Type: 'SCREENSHOT', 
      ProjectName: payload.project.projectName
    }
  }).promise();

  for(const action of payload.project.actions) {
    console.log(action);

    try {
      // Actionの内容をSQSに登録
      result[action.actionId] = await SQS.sendMessage({
        MessageBody: JSON.stringify(action),
        QueueUrl: SQS_QUEUE_URL,
      }).promise();

      // DynamoDBにメタデータ(Result)の登録
      await DYNAMODB.put({
        TableName: DYNAMODB_TABLE_NAME,
        Item: {
          Id: 'Result-1',
          Type: 'SCREENSHOT', 
          ResultName: action.actionName,
          Progress: '未処理',
          ResultSetId: 'Result-Set-1'
        }
      }).promise();

    } catch (error) {
      result[action.actionId] = error;
    }
  }

  console.log(result);

  try {
    response = {
      'statusCode': 200,
      'body': JSON.stringify({
        message: result,
      })
    }
  } catch (err) {
    console.log(err);
    return err;
  }

  return response
}
