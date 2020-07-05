const AWS = require('aws-sdk');
const SQS = new AWS.SQS({apiVersion: '2012-11-05'});
const SQS_QUEUE_URL = process.env.SCREENSHOT_PROCESS_SQS;
const dynamodbDao = require('dynamodb-dao');

exports.lambda_handler = async (event, context) => {
  const payload = JSON.parse(event.body);

  var result = {};

  // DynamoDBにメタデータ(Result-Set)の登録
  const resultSetId = `Result-Set-${await dynamodbDao.getResultSetId()}`
  await dynamodbDao.put({
      Id: resultSetId,
      Type: 'SCREENSHOT', 
      ProjectName: payload.project.projectName
  });

  result[resultSetId] = {};

  for(const action of payload.project.actions) {
    try {
      // Actionの内容をSQSに登録
      await SQS.sendMessage({
        MessageBody: JSON.stringify(action),
        QueueUrl: SQS_QUEUE_URL,
      }).promise();

      // DynamoDBにメタデータ(Result)の登録
      const putParams = {
        Id: `Result-${await dynamodbDao.getResultId()}`,
        Type: 'SCREENSHOT', 
        ResultName: action.actionName,
        Progress: '未処理',
        ResultSetId: resultSetId
      }
      await dynamodbDao.put(putParams);

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