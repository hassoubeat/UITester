exports.lambda_handler = async (event, context) => {
  for(let record of event['Records']) {
    console.log('lambda-sqs-challenge');
    console.log(record["body"]);
  }

  const response = {
      statusCode: 200,
      body: JSON.stringify('Hello from Lambda!'),
  };
  return response;
}
