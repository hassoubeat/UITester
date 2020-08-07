const AWS = require('aws-sdk');
const dynamodbDao = require('dynamodb-dao');

const SQS_QUEUE_URL = process.env.SCREENSHOT_PROCESS_SQS;
const UITESTER_DYNAMODB_TABLE_NAME = process.env.UITESTER_DYNAMODB_TABLE_NAME;

exports.lambda_handler = async (event, context) => {
  const sqs = new AWS.SQS({apiVersion: '2012-11-05'});
  const dynamoDB = new AWS.DynamoDB.DocumentClient();

  const payload = JSON.parse(event.body);

  var result = {};

  // DynamoDBにメタデータ(Result-Set)の登録
  const resultSetId = `Result-Set-${await dynamodbDao.getResultSetId(dynamoDB, UITESTER_DYNAMODB_TABLE_NAME)}`
  await dynamodbDao.put(
    dynamoDB,
    {
      TableName: UITESTER_DYNAMODB_TABLE_NAME,
      Item: {
        Id: resultSetId,
        Type: 'SCREENSHOT',
        ResultSetName: payload.resultSet.resultSetName
      }
    }
  );

  result.results = [];

  
  // Actionsをイテレータが扱えるMapに変換
  const actions = Object.entries(payload.resultSet.actions)

  for(const [actionName, action] of actions) {
    // actionNameをセット
    action.actionName = actionName;
    try {
      const resultId = `Result-${await dynamodbDao.getResultId(dynamoDB, UITESTER_DYNAMODB_TABLE_NAME)}`;
      // DynamoDBにメタデータ(Result)の登録
      const putObject = {
        TableName: UITESTER_DYNAMODB_TABLE_NAME,
        Item: {
          Id: resultId,
          Type: 'SCREENSHOT', 
          ResultName: action.actionName,
          Progress: '未処理',
          ResultSetId: resultSetId
        }
      }
      await dynamodbDao.put(dynamoDB, putObject);

      // キューイングデータにID情報を追加
      action.resultSetId = resultSetId;
      action.resultId = resultId;

      // Actionの内容をSQSに登録
      await sqs.sendMessage({
        MessageBody: JSON.stringify(action),
        QueueUrl: SQS_QUEUE_URL,
      }).promise();

      result.results.push(putObject.Item);

    } catch (error) {
      result.results.push(error.message);
    }
  }

  console.log(result);

  try {
    var response = {
      'statusCode': 200,
      'headers': {
        "Access-Control-Allow-Headers" : "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS, POST"
      },
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