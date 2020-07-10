const AWS = require('aws-sdk');
const SQS = new AWS.SQS({apiVersion: '2012-11-05'});
const DYNAMODB = new AWS.DynamoDB.DocumentClient();

const screenshotProcessQueing = require('./app');

exports.lambda_handler = async (event, context) => {
  const diComponents = {
    SQS: SQS,
    DYNAMODB: DYNAMODB
  };
  return await screenshotProcessQueing({diComponents, event, context});
}