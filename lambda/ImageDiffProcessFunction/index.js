const AWS = require('aws-sdk');
const S3 = new AWS.S3();

const fs = require('fs');
const resemble = require('node-resemble-js');
const dynamodbDao = require('dynamodb-dao');

const UITESTER_S3_BUCKET_NAME = process.env.UITESTER_S3_BUCKET_NAME;
const UITESTER_DYNAMODB_TABLE_NAME = process.env['UITESTER_DYNAMODB_TABLE_NAME'];

// 差分比較
const compareTo = (file1, file2) => {
    return new Promise( (resolve, reject) => {
        resemble(file1.Body).compareTo(file2.Body).ignoreColors().onComplete(diffData => {
            resolve(diffData);
        });
    });
}

// 同期ストリーム処理
const syncStream = (diffData) => {
  return new Promise( (resolve, reject) => {
    const writeStream = fs.createWriteStream('/tmp/diff.png')
      // stream書き込み終了時のイベント
      .on('close', async () => {
        const fileContent = fs.readFileSync('/tmp/diff.png');
        resolve(fileContent);
      }
    )
    diffData.getDiffImage().pack().pipe(writeStream);
  });
}

exports.lambda_handler = async (event, context) => {
  const dynamoDbDocumentClient = new AWS.DynamoDB.DocumentClient();
  var diffPayload = JSON.parse(event['Records'][0]['body']);

  // S3から比較対象ファイルの取得
  const originImage = await S3.getObject({
    Bucket: UITESTER_S3_BUCKET_NAME,
    Key: diffPayload.originS3ObjectKey
  }).promise();
  const targetImage = await S3.getObject({
    Bucket: UITESTER_S3_BUCKET_NAME,
    Key: diffPayload.targetS3ObjectKey
  }).promise();

  // ファイルの比較、ストリームデータへの変換
  const diffData = await compareTo(originImage, targetImage);
  console.log(diffData);

  const diffFileContent = await syncStream(diffData);

  // S3に差分結果をアップロード
  const s3PutParams = {
    Bucket: UITESTER_S3_BUCKET_NAME,
    Key: `result/${diffPayload.resultSetId}/${diffPayload.resultName}.png`,
    Body: diffFileContent,
    ContentType: 'image/png'
  }
  await S3.putObject(s3PutParams).promise();

  // 保存後にDynamoDBのステータス更新
  await dynamodbDao.update(
    dynamoDbDocumentClient,
    {
      TableName: UITESTER_DYNAMODB_TABLE_NAME,
      Key: {
        Id : diffPayload.resultId
      },
      UpdateExpression: "Set Progress=:progress, S3ObjectKey=:s3ObjectKey, DiffMisMatchRate=:diffMisMatchRate",
      ExpressionAttributeValues: {
        ":progress": "処理済",
        ":s3ObjectKey": s3PutParams.Key,
        ":diffMisMatchRate": diffData.misMatchPercentage
      }
    }
  );
};