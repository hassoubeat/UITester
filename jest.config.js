// jest.config.js
const {defaults} = require('jest-config');
module.exports = {
  // テスト実行時、モジュール探索からパスを除外する
  modulePathIgnorePatterns: [
      ".aws-sam/*"
  ],
};