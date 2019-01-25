const express = require('express');
const app = express();
const log = require('./log');
const Mock = require('mockjs');
const { postMessageToStaff } = require('./qiyu-helper');

app.get('/qiyu', function (req, res) {
  // 用户组， 消息发送间隔
  const { accountArr, interval = 5000 } = req.query;
  res.send(req.query);

  if (accountArr) {
    const arr = accountArr.split(',');
    arr.length && arr.forEach(async (accountId) => {
      try {
        await handlePostMessageToStaff(accountId, interval);
        log.success(`${accountId} 模拟会话成功, 当前消息频率 ${interval}ms`);
      } catch (err) {
        log.error(err);
      }
    })
  }
})

const handlePostMessageToStaff = async (accountId, interval = 5000) => {
  const timer = setInterval(async () => {
    const content = Mock.mock('@csentence');
    try {
      // 向七鱼发送文本消息
      await postMessageToStaff(accountId, "TEXT", content);
    } catch (err) {
      log.error(err);
    }
  }, interval < 1000 ? 1000 : interval);
}

app.listen(7007);
console.log('working server is on port 7007 now...');