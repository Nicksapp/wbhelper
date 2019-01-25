'use strict';

const Command = require('common-bin');
const log = require('../log');
const path = require('path');
const axios = require('axios');
const { prompt } = require('enquirer');
const { requestApplyStaff } = require('../qiyu-helper');
const Store = require('data-store');

const questionConfig = [{
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
  message: '请选择希望模拟接入的用户数, 默认为 3 个',
  initial: 3,
  validate(val) {
    if (+val && typeof +val === 'number') {
      return +val > 20 ? '当前限制最大同时接入 20 个用户' : true;
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
    if (+val && typeof +val === 'number') {
      return +val < 1000 ? '当前限制最小值为 1000ms' : true;
    }
  }
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
    });
  }

  async run({ argv }) {
    const { reset} = argv;
    let qiyuCache = new Store({ path: `${__dirname}/../../data/qiyuConfig.json` });
    reset && qiyuCache.set('session_config', null);

    let sessionConfig = qiyuCache.get('session_config');

    if (!sessionConfig) {
      try {
        sessionConfig = await prompt(questionConfig);
        qiyuCache.set('session_config', sessionConfig);
      } catch (err) {return;}
    } else {
      log.default('检测到配置记录，自动执行')
    }

    const { staffId, accountNum, interval } = sessionConfig;
    let accountArr = [];
    for (let i = 0; i < +accountNum; i++) {
      const accountId = `laotest${~~(Math.random() * 100)}@163.com`;
      await requestApplyStaff(accountId, {
        staffId
      });
      accountArr.push(accountId);
    }
    // 启动一个服务进程后台持续模拟消息发送
    this.helper.forkNode(path.resolve(__dirname, '../working-server.js'));
    setTimeout(() => {
      axios.get(`http://localhost:7007/qiyu?accountArr=${accountArr.join(',')}&interval=${interval}`);
    }, 1500);
  }

  get description() {
    return 'Clone a repository into a new directory';
  }
}

module.exports = QiyuCommand;