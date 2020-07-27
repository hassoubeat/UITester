const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const dynamodbDao = require('dynamodb-dao');

const dedent = require('dedent-js');
const columnify = require('columnify');
const ejs = require('ejs');

const UITESTER_S3_BUCKET_NAME = process.env.UITESTER_S3_BUCKET_NAME;
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
        reportObj.report = await outputHtmlReport(queryResult.Items);
        reportObj.contentType = "text/html";
        break;
      default:
        throw new Error('Please specify the correct report type');
    }

    let response = {
      'statusCode': 200,
      'headers': {
        "content-type" : reportObj.contentType,
        "Access-Control-Allow-Headers" : "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS, GET"
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
  const sortedResultList = mapIdSort(resultList);
  return columnify(sortedResultList, {
    columns: ['Id', 'ResultName', 'Progress', 'Type', 'DiffMisMatchRate', 'S3ObjectKey', 'OriginS3ObjectKey', 'TargetS3ObjectKey', 'ResultSetId'],
    columnSplitter: ' | '
  });
}
exports.outputConsoleReport = outputConsoleReport;

// HTMLレポートの出力処理
async function outputHtmlReport(resultList) {
  // URLを成形
  resultList.forEach((result) => {
    result.diffObj =  {
      origin: s3ObjectUrl(UITESTER_S3_BUCKET_NAME, result.OriginS3ObjectKey),
      target: s3ObjectUrl(UITESTER_S3_BUCKET_NAME, result.TargetS3ObjectKey),
      diffResult: s3ObjectUrl(UITESTER_S3_BUCKET_NAME, result.S3ObjectKey)
    }
  });
  return await ejs.renderFile(`${__dirname}/HtmlReportDevelop/index.ejs`, { resultList: mapIdSort(resultList)});
}
exports.outputHtmlReport = outputHtmlReport;

// Map要素のIdでソートする
function mapIdSort(mapList, isASC=true) {
  return mapList.sort((a, b) => {
    aId = Number(a.Id.split('-').slice(-1)[0]);
    bId = Number(b.Id.split('-').slice(-1)[0]);
    if (isASC) {
      if(aId < bId) return -1;
      if(aId > bId) return 1;
    } else {
      if(aId < bId) return 1;
      if(aId > bId) return -1;
    }
    return 0;
  });
}
exports.mapIdSort = mapIdSort;

// S3のオブジェクトURLの取得
function s3ObjectUrl(bucketName, objKey) {
  return `https://${bucketName}.s3.amazonaws.com/${objKey}`
}