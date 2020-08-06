const AUTH_TOKEN = process.env.AUTH_TOKEN;

exports.lambda_handler =  function(event, context, callback) {
  try {
    const queryAuthToken = event.queryStringParameters.authToken;

    if (authorize(queryAuthToken)) {
      callback(null, generatePolicy('user', 'Allow', "arn:aws:execute-api:*"));
    } else {
      callback("Unauthorized");   // Return a 401 Unauthorized response
    } 
  } catch (error) {
    console.error(error);
    callback("Error: Invalid token"); // Return a 500 Invalid token response
  }
};

// 認証処理
function authorize(queryAuthToken) {
    if (queryAuthToken === AUTH_TOKEN) {
        return true;
    } else {
        return false;
    }

}

// 認証用IAMポリシーの生成
function generatePolicy(principalId, effect, resource) {
  var authResponse = {};
  
  authResponse.principalId = principalId;
  if (effect && resource) {
      var policyDocument = {};
      policyDocument.Version = '2012-10-17'; 
      policyDocument.Statement = [];
      var statementOne = {};
      statementOne.Action = 'execute-api:Invoke'; 
      statementOne.Effect = effect;
      statementOne.Resource = resource;
      policyDocument.Statement[0] = statementOne;
      authResponse.policyDocument = policyDocument;
  }
  return authResponse;
}
