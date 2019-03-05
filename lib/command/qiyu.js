'use strict';

const Command = require('common-bin');
const log = require('../log');
const path = require('path');
const axios = require('axios');
const Store = require('data-store');
const { prompt } = require('enquirer');
const { requestApplyStaff, mockWsMessageIn } = require('../qiyu-helper');
const Config = require('../config/qiyu');

class QiyuCommand extends Command {
  constructor(rawArgv) {
    super(rawArgv);
    this.yargs.usage('qiyu');

    this.yargs.options({
      reset: {
        alias: 'r',
        type: 'boolean',
        description: '是否重置配置, 默认自动读取上次配置项',
      },
      continued: {
        alias: 'c',
        type: 'number',
        description: '不指定用户数量, 指定进线频率, 持续模拟用户进线'
      },
      mock: {
        alias: 'm',
        type: 'boolean',
        description: '是否模拟一条 ws 消息推送进来 【临时使用】'
      },
      isProduction: {
        alias: 'p',
        type: 'boolean',
        description: '是否模拟线上环境，默认为测试环境'
      }
    });
  }

  async run({ argv }) {
    const { reset, continued, mock, isProduction = false } = argv;
    let qiyuCache = new Store({ path: `${__dirname}/../../data/qiyuConfig.json` });
    reset && qiyuCache.set('session_config', null);

    let sessionConfig = qiyuCache.get('session_config');

    if (!sessionConfig || continued) {
      try {
        if (continued) {
          Config.questionConfig.splice(1, 1);
          log.default('已进入模拟随机用户持续进线模式');
        }
        sessionConfig = await prompt(Config.questionConfig);
        qiyuCache.set('session_config', sessionConfig);
      } catch (err) {return;}
    } else {
      log.default('检测到配置记录，自动执行')
    }

    const {
      staffId, // 客服 id
      accountNum, // 用户数量
      interval, // 消息频率
      fromTitle,  // 发起操作的页面标题
      keywords // sop 关键词
    } = sessionConfig;
    let accountArr = [];

    // 启动一个服务进程后台持续模拟消息发送
    this.helper.forkNode(path.resolve(__dirname, '../working-server.js'));
    if (continued && typeof continued === 'number') {
      setInterval(async () => {
        try {
          const accountId = `laotest${~~(Math.random() * 100)}@163.com`;
          const sessionData = await requestApplyStaff(accountId, {
            staffId,
            fromTitle
          }, isProduction);
          await axios.get(`http://localhost:7007/qiyu?accountArr=${accountId}&interval=${interval}&isProduction=${!!isProduction}&keywords=${encodeURIComponent(keywords)}`);

          if (mock && sessionData && sessionData.sessionId) {
            await mockWsMessageIn(sessionData.sessionId)
          }
        } catch (err) {
          log.error(err)
        }
      }, continued);
    } else {
      for (let i = 0; i < +accountNum; i++) {
        try {
          const accountId = `laotest${~~(Math.random() * 100)}@163.com`;
          await requestApplyStaff(accountId, {
            staffId,
            fromTitle
          }, isProduction);
          accountArr.push(accountId);
        } catch (err) {
          log.error(err)
        }
      }
      setTimeout(() => {
        axios.get(`http://localhost:7007/qiyu?accountArr=${accountArr.join(',')}&interval=${interval}&keywords=${encodeURIComponent(keywords)}`);
      }, 1500);
    }
  }

  get description() {
    return 'Clone a repository into a new directory';
  }
}

module.exports = QiyuCommand;