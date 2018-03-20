// 厳格モード
'use strict';
// twitterモジュール呼び出し
const Twitter = require('twitter');
// cronモジュール呼び出し
const cron = require('cron').CronJob;

// Twitterクライアント作成
const client = new Twitter({
  // Twitterに登録した情報
  consumer_key: process.env.TWITTER_API_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_API_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_API_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_API_ACCESS_TOKEN_SECRET
});

let checkedTweets = [];

/**
 * ホームのタイムラインを出力する処理
 */
function getHomeTimeLine() {
  // APIにアクセスする
  client.get('statuses/home_timeline',
    {},
    function (error, tweets, response) {
      // console.log('checkedTweets');
      // console.log(checkedTweets);

      if (error) {
        console.log(error);
      }
      // console.log(tweets);

      // 初回起動時は取得するだけで終了
      if (checkedTweets.length === 0) {
        // 初期ツイートを走査して
        tweets.forEach(function (homeTimeLineTweet, key) {
          // 配列に追加
          checkedTweets.push(homeTimeLineTweet); // 配列に追加
        });
        return;
      }
      // 新規ツイートを格納する配列
      const newTweets = [];
      // 取得ツイートを走査して
      tweets.forEach(function (homeTimeLineTweet, key) {
        // 取得済みでなければ
        if (isCheckedTweet(homeTimeLineTweet) === false) {
          // リプライする
          responseHomeTimeLine(homeTimeLineTweet);
          // 新規ツイートに追加
          newTweets.push(homeTimeLineTweet); // 新しいツイートを追加
        }
      });

      // 調査済みリストに追加と、千個を超えていたら削除
      // 新規ツイートを取得済みツイートの先頭に追加
      checkedTweets = newTweets.concat(checkedTweets); // 配列の連結
      // 1000件を超えてたら古い方から削除
      if (checkedTweets.length > 1000) checkedTweets.length = 1000;

    }
  );
}



function isCheckedTweet(homeTimeLineTweet) {
  // ボット自身のツイートは無視する。
  if (homeTimeLineTweet.user.screen_name === '${ボットのスクリーンネーム}') {
    return true;
  }

  for (let checkedTweet of checkedTweets) {
    // 同内容を連続投稿をするアカウントがあるため、一度でも返信した内容は返信しない仕様にしています。
    // ツイートIDが同一、もしくはツイート内容が同一ならチェック済みと判断する
    if (checkedTweet.id_str === homeTimeLineTweet.id_str || checkedTweet.text === homeTimeLineTweet.text) {
      return true;
    }
  }

  return false;
}


const responses = ['面白い！', 'すごい！', 'なるほど！'];

/**
 * ツイートに対してリプライを返す
 * @param {*} homeTimeLineTweet 
 * @gladiolussさん「てすと」 面白い！
 */
function responseHomeTimeLine(homeTimeLineTweet) {
  console.log('twwwww');
  const tweetMessage = '@' + homeTimeLineTweet.user.screen_name + '「' + homeTimeLineTweet.text + '」 ' + responses[Math.floor(Math.random() * responses.length)];
  // ツイートを投稿する
  client.post('statuses/update', {
    // 投稿内容
    status: tweetMessage,
    // リプライ先のツイートID
    in_reply_to_status_id: homeTimeLineTweet.id_str
  })
    .then((tweet) => {
      console.log(tweet);
    })
    .catch((error) => {
      throw error;
    });
}


// cronのタスク
const cronJob = new cron({
  // 3分毎に実行する
  cronTime: '00 0-59/3 * * * *', // ３分ごとに実行
  // newした後即時実行
  start: true, // newした後即時実行するかどうか
  // onTickの関数が実行される
  onTick: function () {
    // getHomeTimeLine();
  }
});
// getHomeTimeLine();

// 監視するストリーム
const stream = client.stream(
  'statuses/filter', 
  // 監視する文章
  { track: '@yyjjkkyymm' }
);

// 'data'イベントをとらえたら発火
stream.on('data', function (tweet) {
  console.log(tweet.text);
  // (*´ω｀*)
  const tweetMessage = '@' + tweet.user.screen_name + ' (*´ω｀*)';
  // 投稿する
  client.post('statuses/update', {
    // 投稿内容
    status: tweetMessage,
    // リプライ先のツイートID
    in_reply_to_status_id: tweet.id_str
  })
    .then((tweet) => {
      console.log(tweet);
    })
    .catch((error) => {
      throw error;
    });
});

// エラー処理
stream.on('error', function (error) {
  throw error;
});
