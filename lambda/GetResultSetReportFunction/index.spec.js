const AWS = require('aws-sdk');
const dynamoDbDao = require('dynamodb-dao');
const dedent = require('dedent-js');

// 環境変数の設定
process.env.UITESTER_DYNAMODB_TABLE_NAME = "dummy"

const getResultSetReportFunction = require("./index");

// jestのマニュアルモック利用
jest.mock('dynamodb-dao');

describe('GetResultSetReportFunction Success Group', () => {

  // beforeAll( async () => {
  //   console.log("beforeAll");
  // });

  // beforeEach( async () => {
  // });

  // HTMLレポート出力処理のテスト
  test('outputHtmlReport test', async () => {
    console.log("outputHtmlReport test");

    const report = getResultSetReportFunction.outputHtmlReport();

    const correct = dedent`
    <!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta charset="utf-8">
        <title>ImageDiffReport</title>
        <meta name="description" content="">
        <meta name="author" content="">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="">
      </head>
      <body>
      Test
      </body>
    </html>
    `;

    expect(report).toEqual(correct);
  });

  // afterEach( async () => {
  // });

  // afterAll( async () => {
  //   console.log("afterAll");
  // });
});