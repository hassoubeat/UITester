const AWS = require('aws-sdk');
const SQS = new AWS.SQS({apiVersion: '2012-11-05'});
const SQS_QUEUE_URL = process.env.SCREENSHOT_PROCESS_SQS;

exports.lambda_handler = async (event, context) => {
  console.log(event);
  const payload = JSON.parse(event.body);
  console.log(payload);

  var result = {};

  // Actionの内容をSQSに登録
  for(const action of payload.project.actions) {
    console.log(action);
    let params = {
      MessageBody: JSON.stringify(action),
      QueueUrl: SQS_QUEUE_URL,
    };
    try {
      result[action.actionId] = await SQS.sendMessage(params).promise();
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
