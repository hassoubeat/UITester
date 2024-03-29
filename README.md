# UITester

対象のWebページのスクリーンショットを撮影・差分比較を行うE2Eテストツールです。
AWSアーキテクチャを利用したサーバレスのシステムです。

![system diagram](https://raw.githubusercontent.com/hassoubeat/UITester/add_readme/readme%20materials/system%20diagram.png)

## Usage

以下の4ステップで利用を行うことが可能です。

### 1. AWS SAMを利用して対象リソースをデプロイ
AWS SAMを利用して各種リソースを定義しています。

```
# AWS SAMのビルド
sam build -u

# AWS SAMのデプロイ(初回)
sam deploy --guided

# AWS SAMのデプロイ(二回目以降)
sam deploy
```

### 2. Webコンソールの設定
Webコンソール(dist/index.html)の以下の内容をデプロイのリソース内容に置き換えてください。

``` 
# 置き換え対象コード
const REST_API_DOMAIN = "xxx";
const ENV = "xxx"
const AUTH_TOKEN = "xxx";

# 置き換え例：
const REST_API_DOMAIN = "https://1234567890.execute-api.ap-northeast-1.amazonaws.com";
const ENV = "stg"
const AUTH_TOKEN = "hogehoge";
```

### 3. ローカルWebサーバ起動
ローカルWebサーバを起動する。

```
# dockerコンテナの起動
docker-compose up -d
```

### 4. Webコンソールへのアクセス
`localhost:8200`にアクセスすることでWebコンソールにアクセスが行えます。

![Web Console](https://raw.githubusercontent.com/hassoubeat/UITester/add_readme/readme%20materials/web%20console.png)

## UnitTest
一部処理はユニットテストを実装しています。

```
# jestなどモジュールのインストール
npm install

# localstackの起動
docker-compose up -d

# テストの実行
npx jest
```