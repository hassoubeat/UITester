const AWS = require('aws-sdk');
const dynamoDbDao = require('dynamodb-dao');
const dedent = require('dedent-js');
const fs = require("fs");

// 環境変数の設定
process.env.UITESTER_S3_BUCKET_NAME = "dummy"
process.env.UITESTER_DYNAMODB_TABLE_NAME = "dummy"


const getResultSetReportFunction = require("./index");

// jestのマニュアルモック利用
jest.mock('dynamodb-dao');

const resultList = [
  {
    "ResultName": "iPhone 6(横)",
    "DiffMisMatchRate": "0.01",
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
    "DiffMisMatchRate": "29.91",
    "OriginS3ObjectKey": "result/Result-Set-1/iPhone 6(縦).png",
    "ResultSetId": "Result-Set-18",
    "TargetS3ObjectKey": "result/Result-Set-2/iPhone 6(縦).png",
    "Id": "Result-31",
    "Type": "SCREENSHOT_DIFF",
    "Progress": "処理済",
    "S3ObjectKey": "result/Result-Set-18/iPhone 6(縦).png"
  },
  {
    "ResultName": "iPhone 6(エラー)",
    "OriginS3ObjectKey": "result/Result-Set-1/iPhone 6(縦).png",
    "ResultSetId": "Result-Set-18",
    "TargetS3ObjectKey": "result/Result-Set-2/iPhone 6(縦).png",
    "Id": "Result-33",
    "Type": "SCREENSHOT_DIFF",
    "Progress": "エラー",
    "ErrorMessage": "Lambda run time exceeded."
  }
]

describe('GetResultSetReportFunction Success Group', () => {

  // beforeAll( async () => {
  //   console.log("beforeAll");
  // });

  // beforeEach( async () => {
  // });

  // コンソールレポート出力処理のテスト
  test('outputConsoleReport test', async () => {
    console.log("outputConsoleReport test");

    const report = getResultSetReportFunction.outputConsoleReport(resultList);
    console.log(report);
    const correct = dedent`
      ID        | RESULTNAME       | PROGRESS | ERRORMESSAGE              | TYPE            | DIFFMISMATCHRATE | S3OBJECTKEY                           | ORIGINS3OBJECTKEY                    | TARGETS3OBJECTKEY                    | RESULTSETID  
      Result-31 | iPhone 6(縦)     | 処理済   |                           | SCREENSHOT_DIFF | 29.91            | result/Result-Set-18/iPhone 6(縦).png | result/Result-Set-1/iPhone 6(縦).png | result/Result-Set-2/iPhone 6(縦).png | Result-Set-18
      Result-32 | iPhone 6(横)     | 処理済   |                           | SCREENSHOT_DIFF | 0.01             | result/Result-Set-18/iPhone 6(横).png | result/Result-Set-1/iPhone 6(横).png | result/Result-Set-2/iPhone 6(横).png | Result-Set-18
      Result-33 | iPhone 6(エラー) | エラー   | Lambda run time exceeded. | SCREENSHOT_DIFF |                  |                                       | result/Result-Set-1/iPhone 6(縦).png | result/Result-Set-2/iPhone 6(縦).png | Result-Set-18
    `
    expect(report).toEqual(correct);
  });

  // HTMLレポート出力処理のテスト
  test('outputHtmlReport test', async () => {
    console.log("outputHtmlReport test");

    const report = await getResultSetReportFunction.outputHtmlReport(resultList);
    console.log(report);
    const correct = fs.readFileSync(`${__dirname}/HtmlReportDevelop/index.html`, 'utf-8');
    
    expect(report).toEqual(correct);
  });

  test('mapIdList test', async () => {
    console.log("mapIdList test");

    const mapIdList = [
      { "Id": "Result-2", },
      { "Id": "Result-3", },
      { "Id": "Result-1", }
    ]

    // 昇順ソートのテスト
    const ascSortedMapList = getResultSetReportFunction.mapIdSort(mapIdList);
    expect(ascSortedMapList).toEqual([
      { "Id": "Result-1", },
      { "Id": "Result-2", },
      { "Id": "Result-3", }
    ]);

    // 降順ソートのテスト
    const descSortedMapList = getResultSetReportFunction.mapIdSort(mapIdList, isAsc=false);
    expect(descSortedMapList).toEqual([
      { "Id": "Result-3", },
      { "Id": "Result-2", },
      { "Id": "Result-1", }
    ]);
  });

  // afterEach( async () => {
  // });

  // afterAll( async () => {
  //   console.log("afterAll");
  // });
});