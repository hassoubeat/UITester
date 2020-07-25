const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const dynamodbDao = require('dynamodb-dao');

const dedent = require('dedent-js');
const columnify = require('columnify');

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
        reportObj.report = outputHtmlReport(queryResult.Items);
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
  const sortedResultList = mapIdAscSort(resultList);
  return columnify(sortedResultList, {
    columns: ['Id', 'ResultName', 'Progress', 'Type', 'DiffMisMatchRate', 'S3ObjectKey', 'OriginS3ObjectKey', 'TargetS3ObjectKey', 'ResultSetId'],
    columnSplitter: ' | '
  });
}
exports.outputConsoleReport = outputConsoleReport;

// TODO HTMLレポートの出力処理 (まだMock)
function outputHtmlReport(resultList) {
  const sortedResultList = mapIdAscSort(resultList);

  // ResultListをStringに変換する無名関数
  const strConvertResultList = (list) => {
    let output = "";
    list.forEach((result) => {
      const strResult = dedent`[
        '${result.Id}',
        '${result.ResultName}',
        '${result.Progress}',
        '${result.Type}',
        '${result.DiffMisMatchRate}',
        '${result.ResultSetId}',
        {
          origin: '${s3ObjectUrl(UITESTER_S3_BUCKET_NAME, result.OriginS3ObjectKey)}',
          target: '${s3ObjectUrl(UITESTER_S3_BUCKET_NAME, result.TargetS3ObjectKey)}',
          diffResult: '${s3ObjectUrl(UITESTER_S3_BUCKET_NAME, result.S3ObjectKey)}',
        }
      ]`
      output = output + strResult + ","
    })
    return output;
  }

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
      <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
      <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.2/css/all.css" integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr" crossorigin="anonymous">
      <link href="https://unpkg.com/gridjs/dist/theme/mermaid.min.css" rel="stylesheet" />
      <style>
        .screenshot {
          max-width: 100%;
        }
        .align-top {
          vertical-align: top;
        }
        .gridjs-sort {
          border: none;
        }
      </style>
    </head>
    <body>
      <div id="resultList"></div>

      <!-- screenshotDiffModal -->
      <div class="modal fade" id="screenshotDiffModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
        <div class="modal-dialog modal-xl" role="document">
          <div class="modal-content">
            <div class="modal-body text-muted">
              <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">ScreenshotDiff Detail</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div id="screenshotDiff"></div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
    <script src="https://code.jquery.com/jquery-3.5.1.min.js" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>
    <script src="https://unpkg.com/gridjs/dist/gridjs.development.js"></script>
    <script>
      var resultListGrid = new gridjs.Grid({
        columns: ['Id', 'ResultName', 'Progress', 'Type', 'DiffMisMatchRate', 'ResultSetId', {
          name: 'Diff',
          sort: false,
          formatter: (diffObj) => gridjs.html(\`<center><button class='btn btn-primary' onclick='showScreenshotDiff("\${diffObj.origin}", "\${diffObj.target}", "\${diffObj.diffResult}")' >Show Detail</button></center>\`)
        }],
        data: [${strConvertResultList(sortedResultList)}],
        sort: true
      }).render(document.getElementById('resultList'));;

      var screenshotDiffGrid = new gridjs.Grid({
        columns: [],
        data: []
      }).render(document.getElementById('screenshotDiff'));

      function showScreenshotDiff(origin, target, diffResult) {
        const diffContent = {
          columns: [
            {
              name: 'Origin',
              formatter: (img) => gridjs.html(\`<div><img class='screenshot' src='\${img}'/><div>\`)
            },
            {
              name: 'Target',
              formatter: (img) => gridjs.html(\`<div><img class='screenshot' src='\${img}'/></div>\`)
            },
            {
              name: 'DiffResult',
              formatter: (img) => gridjs.html(\`<div><img class='screenshot' src='\${img}'/></div>\`)
            },
          ],
          data: [
            [ origin, target, diffResult ]
          ],
          className: {
            td: 'align-top'
          }
        }
        screenshotDiffGrid.updateConfig(diffContent).forceRender(document.getElementById('screenshotDiff'));
        $('#screenshotDiffModal').modal();
      };
    </script>
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

// S3のオブジェクトURLの取得
function s3ObjectUrl(bucketName, objKey) {
  return `https://${bucketName}.s3.amazonaws.com/${objKey}`
}