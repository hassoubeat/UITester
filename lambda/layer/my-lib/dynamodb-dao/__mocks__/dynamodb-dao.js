const dynamoDbDao = jest.genMockFromModule('dynamodb-dao');

dynamoDbDao.put = async (dynamoDB, putObj) => {
  return {}
}

dynamoDbDao.update = async (dynamoDB, updateObj) => {
  return {}
}

dynamoDbDao.query = async (dynamoDB, queryObj) => {
  return {};
}

dynamoDbDao.scan = async (dynamoDB, scanObj) => {
  return {
    Items: [],
    Count: 0,
    ScannedCount: 0
  };
}

dynamoDbDao.getResultSetId = async (dynamoDB, tableName) => {
  return 1;
}

dynamoDbDao.getResultId = async (dynamoDB, tableName) => {
  return 1;
}
module.exports = dynamoDbDao;