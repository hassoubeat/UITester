const AWS = require('aws-sdk');
const resemble = require('node-resemble-js');

const S3 = new AWS.S3();
const fs = require('fs');
const SAVE_BUCKET_NAME = process.env['S3_BUCKET_NAME']

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
    // TODO 全体的にMock状態なのでDynamoDB、全体構成図の設定後に動的に実装するようにする

    // S3から比較対象ファイルの取得
    const originImage = await S3.getObject({
      Bucket: SAVE_BUCKET_NAME,
      Key: 'origin/Action-1.png'
    }).promise();
    const targetImage = await S3.getObject({
      Bucket: SAVE_BUCKET_NAME,
      Key: 'result/Action-1.png'
    }).promise();

    // ファイルの比較、ストリームデータへの変換
    const diffData = await compareTo(originImage, targetImage);
    console.log(diffData);

    const fileContent = await syncStream(diffData);

    // S3に差分結果をアップロード
    const result = await S3.putObject({
      Bucket: SAVE_BUCKET_NAME,
      Key: `diff-result/diff_example.png`,
      Body: fileContent,
      ContentType: 'image/png'
    }).promise();
    console.log(result);
};