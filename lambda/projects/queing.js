exports.lambda_handler = async (event, context) => {
  inputData = JSON.parse(event['body']);
  console.log(inputData.test);
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
