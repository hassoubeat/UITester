const AWS = require('aws-sdk');
const dynamoDbDao = require('dynamodb-dao');
const dedent = require('dedent-js');

// 環境変数の設定
process.env.S3_BUCKET_NAME = "dummy"
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
    const correct = dedent`
      ID        | RESULTNAME   | PROGRESS | TYPE            | DIFFMISMATCHRATE | S3OBJECTKEY                           | ORIGINS3OBJECTKEY                    | TARGETS3OBJECTKEY                    | RESULTSETID  
      Result-31 | iPhone 6(縦) | 処理済   | SCREENSHOT_DIFF | 29.91            | result/Result-Set-18/iPhone 6(縦).png | result/Result-Set-1/iPhone 6(縦).png | result/Result-Set-2/iPhone 6(縦).png | Result-Set-18
      Result-32 | iPhone 6(横) | 処理済   | SCREENSHOT_DIFF | 0.01             | result/Result-Set-18/iPhone 6(横).png | result/Result-Set-1/iPhone 6(横).png | result/Result-Set-2/iPhone 6(横).png | Result-Set-18
    `
    expect(report).toEqual(correct);
  });

  // HTMLレポート出力処理のテスト
  test('outputHtmlReport test', async () => {
    console.log("outputHtmlReport test");

    const report = getResultSetReportFunction.outputHtmlReport(resultList);

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
          data: [[
      'Result-31',
      'iPhone 6(縦)',
      '処理済',
      'SCREENSHOT_DIFF',
      '29.91',
      'Result-Set-18',
      {
        origin: 'https://dummy.s3.amazonaws.com/result/Result-Set-1/iPhone 6(縦).png',
        target: 'https://dummy.s3.amazonaws.com/result/Result-Set-2/iPhone 6(縦).png',
        diffResult: 'https://dummy.s3.amazonaws.com/result/Result-Set-18/iPhone 6(縦).png',
      }
    ],[
      'Result-32',
      'iPhone 6(横)',
      '処理済',
      'SCREENSHOT_DIFF',
      '0.01',
      'Result-Set-18',
      {
        origin: 'https://dummy.s3.amazonaws.com/result/Result-Set-1/iPhone 6(横).png',
        target: 'https://dummy.s3.amazonaws.com/result/Result-Set-2/iPhone 6(横).png',
        diffResult: 'https://dummy.s3.amazonaws.com/result/Result-Set-18/iPhone 6(横).png',
      }
    ],],
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
    console.log(report);

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