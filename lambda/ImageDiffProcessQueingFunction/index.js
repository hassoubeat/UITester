const AWS = require('aws-sdk');
const SQS = new AWS.SQS({apiVersion: '2012-11-05'});
const SQS_QUEUE_URL = process.env.SCREENSHOT_PROCESS_SQS;

const dynamodbDao = require('dynamodb-dao');
const UITESTER_DYNAMODB_TABLE_NAME = process.env['UITESTER_DYNAMODB_TABLE_NAME'];

// レスポンス変数の定義
var response = {
  'statusCode': 200,
  'headers': {
    "Access-Control-Allow-Headers" : "*",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, POST"
  }
}

exports.lambda_handler = async (event, context) => {
  try {
    const dynamoDbDocumentClient = new AWS.DynamoDB.DocumentClient();
    const payload = JSON.parse(event.body);

    var result = {};

    // ResultSetIDからDynamoDBからリザルトを比較する処理を引っ張ってくる
    const originResultList = await dynamodbDao.query(
      dynamoDbDocumentClient,
      {
        TableName: UITESTER_DYNAMODB_TABLE_NAME,
        IndexName: "ResultSearchIndex",
        KeyConditionExpression: "ResultSetId=:resultSetId",
        ExpressionAttributeValues: {
          ":resultSetId": payload.originResultSetId
        }
      }
    );

    const targetResultList = await dynamodbDao.query(
      dynamoDbDocumentClient,
      {
        TableName: UITESTER_DYNAMODB_TABLE_NAME,
        IndexName: "ResultSearchIndex",
        KeyConditionExpression: "ResultSetId=:resultSetId",
        ExpressionAttributeValues: {
          ":resultSetId": payload.targetResultSetId
        }
      }
    );

    // DynamoDBにメタデータ(Result-Set)の登録
    const resultSetId = `Result-Set-${await dynamodbDao.getResultSetId(dynamoDbDocumentClient, UITESTER_DYNAMODB_TABLE_NAME)}`
    await dynamodbDao.put(
      dynamoDbDocumentClient,
      {
        TableName: UITESTER_DYNAMODB_TABLE_NAME,
        Item: {
          Id: resultSetId,
          Type: 'SCREENSHOT_DIFF', 
          ResultSetName: payload.resultSetName,
          OriginResultSetId: payload.originResultSetId,
          TargetResultSetId: payload.targetResultSetId
        }
      }
    );

    result.results = [];

    for(const originResult of originResultList.Items) {
      // 比較対象配列の中に同じResultNameを持つデータ(比較対象)が存在するかをチェック
      const targetResult = targetResultList.Items.find(targetResult => originResult.ResultName === targetResult.ResultName);

      // 比較対象が存在しない場合はスキップ
      if (!targetResult) continue;

      // DynamoDBにメタデータ登録
      const resultId = `Result-${await dynamodbDao.getResultId(dynamoDbDocumentClient, UITESTER_DYNAMODB_TABLE_NAME)}`;

      let putObject = {
        TableName: UITESTER_DYNAMODB_TABLE_NAME,
        Item: {
          Id: resultId,
          Type: 'SCREENSHOT_DIFF', 
          ResultName: originResult.ResultName,
          Progress: '未処理',
          OriginS3ObjectKey: originResult.S3ObjectKey,
          TargetS3ObjectKey: targetResult.S3ObjectKey,
          ResultSetId: resultSetId
        }
      }
      
      await dynamodbDao.put(dynamoDbDocumentClient, putObject);

      // SQSにデータ追加
      var diffQueingMessage = {
        originS3ObjectKey: originResult.S3ObjectKey,
        targetS3ObjectKey: targetResult.S3ObjectKey,
        resultSetId: resultSetId,
        resultId: resultId,
        resultName: originResult.ResultName
      }

      // 比較処理用のメッセージをSQSに登録
      await SQS.sendMessage({
        MessageBody: JSON.stringify(diffQueingMessage),
        QueueUrl: SQS_QUEUE_URL,
      }).promise();

      result.results.push(putObject.Item);
    }

    console.log(result);

    response.body = JSON.stringify({
      message: result
    });

  } catch (error) {
    console.log(error);

    // エラーレスポンス用の設定
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: error.message,
    });
  } finally {
    return response
  }
}
