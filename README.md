# mf-all-updater

マネーフォワードに登録している金融機関を更新します。

## 使い方

```sh
$ yarn
$ export EMAIL=<マネーフォワードのログインメールアドレス> 
$ export PASSWORD=<マネーフォワードのログインパスワード> 
$ yarn fetch
```

## 定期的に更新する
WerckerとGoogle Apps Scriptを利用して定期的に更新できます。

### Wercker
1. Workflowsでパイプラインを作成します
  1. `Name`は適当に
  1. `YML Pipeline name`を`fetch`に
  1. `Hook type`を`Git push`
  1. 以上の内容で作成
1. `Pipeline environment variables`に環境変数を登録します
  1. キー名`EMAIL`として、値をマネーフォワードのログインメールアドレス
  1. キー名`PASSWORD`として、値をマネーフォワードのログインメールアドレス
1. Docker Hub の pull 数制限を回避するために Docker Hub の認証情報を `Environment` に登録します
  1. キー名 `DOCKER_HUB_USERNAME` として、値を Docker Hub のユーザーネーム
  2. キー名 `DOCKER_HUB_PASSWORD` として、値を Docker Hub のパスワード
1. (おまけ)Slackに通知するならば、`Environment`タブからキー名`SLACK_HOOKS_URL`として値にSlackのhook URLを登録

### Google Apps Script
1. 新規Google Apps Scriptを作成します
1. ソースは下記の内容で
    ```javascript
    function myFunction() {
        var data = {
            pipelineId: '<werckerのpipelineId>'
        }

        var options = {
            contentType: 'application/json',
            headers: {
                Authorization: 'Bearer <werkcerのtoken>'
            }, 
            method: 'post',
            payload: JSON.stringify(data)
        }

        UrlFetchApp.fetch('https://app.wercker.com/api/v3/runs/', options)
    }
    ```
1. `現在のプロジェクトのトリガー`を適当に

おわり
