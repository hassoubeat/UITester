const AWS = require('aws-sdk');
const SQS = new AWS.SQS({apiVersion: '2012-11-05'});
const SQS_QUEUE_URL = process.env.SCREENSHOT_PROCESS_SQS;

const dynamodbDao = require('dynamodb-dao');
const UITESTER_DYNAMODB_TABLE_NAME = process.env['UITESTER_DYNAMODB_TABLE_NAME'];

exports.lambda_handler = async (event, context) => {
  const payload = JSON.parse(event.body);

  var result = {};

  // DynamoDBにメタデータ(Result-Set)の登録
  const resultSetId = `Result-Set-${await dynamodbDao.getResultSetId(UITESTER_DYNAMODB_TABLE_NAME)}`
  await dynamodbDao.put(
    UITESTER_DYNAMODB_TABLE_NAME,
    {
      Id: resultSetId,
      Type: 'SCREENSHOT', 
      ProjectName: payload.project.projectName
    }
  );

  result[resultSetId] = {};

  for(const action of payload.project.actions) {
    try {
      const resultId = `Result-${await dynamodbDao.getResultId(UITESTER_DYNAMODB_TABLE_NAME)}`;
      // DynamoDBにメタデータ(Result)の登録
      const putParams = {
        Id: resultId,
        Type: 'SCREENSHOT', 
        ResultName: action.actionName,
        Progress: '未処理',
        ResultSetId: resultSetId
      }
      await dynamodbDao.put(UITESTER_DYNAMODB_TABLE_NAME, putParams);

      // キューイングデータにID情報を追加
      action.resultSetId = resultSetId;
      action.resultId = resultId;

      // Actionの内容をSQSに登録
      await SQS.sendMessage({
        MessageBody: JSON.stringify(action),
        QueueUrl: SQS_QUEUE_URL,
      }).promise();

      result[resultSetId][action.actionId] = putParams;

    } catch (error) {
      result[resultSetId][action.actionId] = error.message;
    }
  }

  console.log(result);

  try {
    var response = {
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