'use strict';

const Command = require('common-bin');
const log = require('../log');
const path = require('path');
const axios = require('axios');
const { prompt } = require('enquirer');
const { requestApplyStaff, mockWsMessageIn } = require('../qiyu-helper');
const Store = require('data-store');

let questionConfig = [{
  type: 'input',
  name: 'staffId',
  message: '请输入需要接入的客服 Id:',
  header: '七鱼系统来访会话模拟配置',
  hint: '请输入已处于在线状态的客服 ID',
  history: {
    store: new Store({ path: `${__dirname}/../../data/qiyu_staffId.json` }),
    autosave: true
  },
  validate(val) {
    if (+val && typeof + val === 'number') {
      return true;
    }
    return '请输入正确的客服 Id';
  }
}, {
  type: 'input',
  name: 'accountNum',
  float: false,
  message: '请选择希望模拟接入的用户数, 默认为 3 个, 最大支持 100 个（每秒进一个）',
  initial: 3,
  validate(val) {
    if (+val && typeof +val === 'number') {
      return +val > 100 ? '当前限制最大同时接入 100 个用户' : true;
    }
    return '请输入数字';
  }
}, {
  type: 'input',
  name: 'interval',
  float: false,
  message: '模拟消息发送频率 (ms)',
  initial: 5000,
  validate(val) {
    if (val) {
      return +val < 1000 ? '当前限制最小值为 1000ms' : true;
    }
  }
}, {
  type: 'input',
  name: 'fromTitle',
  float: false,
  message: '用户发起咨询客服操作的页面的标题',
  initial: '订单详情',
  hint: 'fromTitle 参数设置'
}, {
  type: 'input',
  name: 'keywords',
  float: false,
  message: '模拟消息中希望出现的关键词,将会在消息中随机插入指定的关键词',
  hint: '关键词请用英文逗号间隔',
  initial: '测试'
}];

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
          questionConfig.splice(1, 1);
          log.default('已进入模拟随机用户持续进线模式');
        }
        sessionConfig = await prompt(questionConfig);
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
        const accountId = `laotest${~~(Math.random() * 100)}@163.com`;
        const sessionData = await requestApplyStaff(accountId, {
          staffId,
          fromTitle
        }, isProduction);
        await axios.get(`http://localhost:7007/qiyu?accountArr=${accountId}&interval=${interval}&isProduction=${!!isProduction}&keywords=${encodeURIComponent(keywords)}`);

        if (mock && sessionData && sessionData.sessionId) {
          await mockWsMessageIn(sessionData.sessionId)
        }
      }, continued);
    } else {
      for (let i = 0; i < +accountNum; i++) {
        const accountId = `laotest${~~(Math.random() * 100)}@163.com`;
        await requestApplyStaff(accountId, {
          staffId,
          fromTitle
        }, isProduction);
        accountArr.push(accountId);
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