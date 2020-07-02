const AWS = require('aws-sdk');
const SQS = new AWS.SQS({apiVersion: '2012-11-05'});
const SQS_QUEUE_URL = process.env.SCREENSHOT_PROCESS_SQS;

exports.lambda_handler = async (event, context) => {
  inputData = JSON.parse(event['body']);
  console.log(inputData.test);

  let params = {
    MessageBody: inputData.test,
    QueueUrl: SQS_QUEUE_URL,
  };

  result = await SQS.sendMessage(params).promise();
  console.log(result);

  try {
    response = {
      'statusCode': 200,
      'body': JSON.stringify({
        message: 'hello world',
      })
    }
  } catch (err) {
    console.log(err);
    return err;
  }

  return response
}
