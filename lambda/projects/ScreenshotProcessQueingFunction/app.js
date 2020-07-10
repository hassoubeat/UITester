const dynamodbDao = require('dynamodb-dao');

const SQS_QUEUE_URL = process.env.SCREENSHOT_PROCESS_SQS;
const UITESTER_DYNAMODB_TABLE_NAME = process.env.UITESTER_DYNAMODB_TABLE_NAME;

module.exports = async ({diComponents, event}) => {
  sqs = diComponents.SQS;
  dynamoDB = diComponents.DYNAMODB;

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
        ProjectName: payload.project.projectName
      }
    }
  );

  result[resultSetId] = {};

  for(const action of payload.project.actions) {
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

      result[resultSetId][action.actionId] = putObject.Item;

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