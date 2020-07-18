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

  // コンソールレポート出力処理のテスト
  test('outputConsoleReport test', async () => {
    console.log("outputConsoleReport test");

    const resultList = [
      {
        "ResultName": "iPhone 6(横)",
        "DiffResultDetail": "{\"isSameDimensions\":true,\"dimensionDifference\":{\"width\":0,\"height\":0},\"misMatchPercentage\":\"0.01\",\"analysisTime\":134}",
        "OriginS3ObjectKey": "result/Result-Set-1/iPhone 6(横).png",
        "ResultSetId": "Result-Set-18",
        "TargetS3ObjectKey": "result/Result-Set-2/iPhone 6(横).png",
        "Id": "Result-32",
        "Type": "SCREENSHOT_DIFF",
        "Progress": "処理済",
        "S3ObjectKey": "result/Result-Set-18/iPhone 6(横).png"
      },
      {
        "ResultName": "iPhone 6(縦)",
        "DiffResultDetail": "{\"isSameDimensions\":false,\"dimensionDifference\":{\"width\":0,\"height\":-270},\"misMatchPercentage\":\"29.91\",\"analysisTime\":1221}",
        "OriginS3ObjectKey": "result/Result-Set-1/iPhone 6(縦).png",
        "ResultSetId": "Result-Set-18",
        "TargetS3ObjectKey": "result/Result-Set-2/iPhone 6(縦).png",
        "Id": "Result-31",
        "Type": "SCREENSHOT_DIFF",
        "Progress": "処理済",
        "S3ObjectKey": "result/Result-Set-18/iPhone 6(縦).png"
      }
    ]

    const report = getResultSetReportFunction.outputConsoleReport(resultList);

    const correct = dedent`
      ID        | RESULTNAME   | PROGRESS | TYPE            | S3OBJECTKEY                           | ORIGINS3OBJECTKEY                    | TARGETS3OBJECTKEY                    | RESULTSETID  
      Result-31 | iPhone 6(縦) | 処理済   | SCREENSHOT_DIFF | result/Result-Set-18/iPhone 6(縦).png | result/Result-Set-1/iPhone 6(縦).png | result/Result-Set-2/iPhone 6(縦).png | Result-Set-18
      Result-32 | iPhone 6(横) | 処理済   | SCREENSHOT_DIFF | result/Result-Set-18/iPhone 6(横).png | result/Result-Set-1/iPhone 6(横).png | result/Result-Set-2/iPhone 6(横).png | Result-Set-18
    `
    expect(report).toEqual(correct);
  });

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

  test('mapIdList test', async () => {
    console.log("mapIdList test");

    const mapIdList = [
      { "Id": "Result-2", },
      { "Id": "Result-3", },
      { "Id": "Result-1", }
    ]

    const sortedMapList = getResultSetReportFunction.mapIdAscSort(mapIdList);

    expect(sortedMapList).toEqual([
      { "Id": "Result-1", },
      { "Id": "Result-2", },
      { "Id": "Result-3", }
    ]);
  });

  // afterEach( async () => {
  // });

  // afterAll( async () => {
  //   console.log("afterAll");
  // });
});