const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const dynamodbDao = require('dynamodb-dao');

const dedent = require('dedent-js');
const columnify = require('columnify');

const UITESTER_DYNAMODB_TABLE_NAME = process.env.UITESTER_DYNAMODB_TABLE_NAME;

exports.lambda_handler = async (event, context) => {
  try {
    const resultSetId = event.pathParameters.resultSetId;
    const queryResult = await dynamodbDao.query(
      dynamoDB,
      {
        TableName: UITESTER_DYNAMODB_TABLE_NAME,
        IndexName: "ResultSearchIndex",
        KeyConditionExpression: "ResultSetId=:resultSetId",
        ExpressionAttributeValues: {
          ":resultSetId": resultSetId
        }
      }
    );

    const REPORT_TYPE = event.pathParameters.reportType;
    const CONSOLE_REPORT = "console";
    const HTML_REPORT = "html";

    const reportObj = {
      report : "",
      contentType : ""
    };

    switch (REPORT_TYPE) {
      case CONSOLE_REPORT:
        reportObj.report = outputConsoleReport(queryResult.Items);
        reportObj.contentType = "text/plain";
        break;
      case HTML_REPORT:
        reportObj.report = outputHtmlReport(queryResult.Items);
        reportObj.contentType = "text/html";
        break;
      default:
        throw new Error('Please specify the correct report type');
    }

    let response = {
      'statusCode': 200,
      'headers': {
        "content-type" : reportObj.contentType
      },
      'body': reportObj.report
    }
    return response

  } catch (error) {
    console.error(error);
    let response = {
      'statusCode': 500,
      'body': error.message
    }
    return response
  }
}

// コンソールレポートの出力処理
function outputConsoleReport(resultList) {
  const sortedResultList = mapIdAscSort(resultList);
  return columnify(sortedResultList, {
    columns: ['Id', 'ResultName', 'Progress', 'Type', 'S3ObjectKey', 'OriginS3ObjectKey', 'TargetS3ObjectKey', 'ResultSetId'],
    columnSplitter: ' | '
  });
}
exports.outputConsoleReport = outputConsoleReport;

// HTMLレポートの出力処理
function outputHtmlReport() {
  return dedent`
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
}
exports.outputHtmlReport = outputHtmlReport;

// Map要素のIdの昇順でソートする
function mapIdAscSort(mapList) {
  return mapList.sort((a, b) => {
    if(a.Id < b.Id) return -1;
    if(a.Id > b.Id) return 1;
    return 0;
  });
}
exports.mapIdAscSort = mapIdAscSort;