'use strict';

const Command = require('common-bin');
const { writeFileSync, existsSync, readFileSync } = require('fs');
const { prompt } = require('enquirer');
const axios = require('axios');
const log = require('../log');
const path = require("path");
const spinner = require('ora')('fetching...');
const fileGenerator = require('../file-generator');
const Config = require('../config/nei');

let facadeListFile = require(`../../data/facadeList.json`);

const question_facade = {
  type: 'autocomplete',
  name: 'facadeName',
  message: 'What facade to list?',
  limit: 5,
  suggest(input, choices) {
    return choices.filter(choice => choice.message.includes(input));
  },
  choices: []
};

const question_apiSelect = {
  type: 'MultiSelect',
  name: 'apiList',
  message: 'Click blank space to pick your working Api, null mains All',
  choices: []
}


class NeiCommand extends Command {
  constructor(rawArgv) {
    super(rawArgv);
    this.yargs.usage('ever [options]');

    this.yargs.options({
      groupName: {
        type: 'string',
        alias: 'g',
        description: '指定项目特定分组，默认全部',
        default: ''
      },
      forceFetch: {
        type: 'boolean',
        alias: 'f',
        description: '是否读取最新 nei 接口数据，如果会读取已存入的本地文件数据',
        default: false
      }
    });

  }

  async run({ argv }) {
    if (!this.isExecPathRight()) return false;
    const WBNeidata = await this.fetchWBNeidata(argv.groupName, argv.forceFetch);
    if (!WBNeidata) return false;
    // 输入结果
    let result = {};
    let facadeAnswer;

    question_facade.choices = Object.keys(WBNeidata);
    try {
      // facade 类名选择
      facadeAnswer = await prompt(question_facade);
    } catch (err) { return; }

    result.facadeName = facadeAnswer.facadeName;
    question_apiSelect.choices = WBNeidata[facadeAnswer.facadeName].map(item => ({
      name: item.path,
      value: item.id
    }));
    
    try {
      // facade 类目 api 选择
      const { apiList } = await prompt(question_apiSelect);
      if (!apiList.length) { // 全部
        result.data = WBNeidata[facadeAnswer.facadeName];
      } else {
        result.data = WBNeidata[facadeAnswer.facadeName].filter(item => apiList.includes(item.path));
      }
    } catch(err) { return; }


    spinner.start();
    for (let item of result.data) {
      const { data:resData } = await this.fetchWBNeiDataDetailById(item.id);
      if (resData && resData.result ) {
        item.inputParams = resData.result.params.inputs.map(item => ({
          name: item.name,
          type: item.typeName,
          isArray: item.isArray || 0
        }));
        item.requestMethods = resData.result.tag.toLowerCase().includes('get') ? 'get' : 'post';
      }
    }
    spinner.stop();
    try {
      await this.handleFileGenerate(result);
    } catch (err) {
      log.error(`文件 Generate 失败: ${err}`);
    }
  }

  get description() {
    return 'Get the Api info from Nei, choose to generate common code.';
  }

  async handleFileGenerate(targetData) {
    if (!targetData) return;
    const cwd = process.cwd();
    const wbhelperConfig = readFileSync(path.join(cwd, '.wbhelper.json'), 'utf8');
    const { nei_config } = JSON.parse(wbhelperConfig);

    targetData.className = targetData.facadeName.split('.').pop().replace(/^\S/, (s) => s.toLowerCase());
    const fileTypes = ['controller', 'service', 'api', 'router'];

    fileTypes.forEach(type => {
      fileGenerator.isTargetFolderExist(nei_config[`${type}_placement`]);
    });
    const fileStatus = {
      controllerFileStatus: await fileGenerator.verifyDirStatus(path.resolve(cwd, nei_config.controller_placement), targetData.className, 'controller'),
      serviceFileStatus: await fileGenerator.verifyDirStatus(path.resolve(cwd, nei_config.service_placement), targetData.className, 'service'),
      apiFileStatus: await fileGenerator.verifyDirStatus(path.resolve(cwd, nei_config.api_placement), targetData.className, 'api')
    }
    fileTypes.map(type => {
      if (type === 'router') {
        fileGenerator.handleRouterGenerate(targetData);
      } else {
        if (!fileStatus[`${type}FileStatus`]) { // 无已存在文件
          fileGenerator.handleWriteFile(targetData, targetData.className, type);
        } else { // 文件已存在，部分修改
          fileGenerator.handleFileContentReplace(targetData, fileStatus[`${type}FileStatus`], targetData.className, type);
        }
      }
    });
    fileGenerator.handleGenerateApiIndex();
  }

  async fetchWBNeidata(groupName, flag) {
    const cacheFacadeData = facadeListFile;
    if (!flag && Object.keys(cacheFacadeData).length) {
      log.default('发现缓存文件,自动读取缓存内容,强制读取最新 api 数据请执行 wbhelper nei -f');
      return cacheFacadeData;
    }
    spinner.start();
    let tableSource = {};
    const res = await axios.get(Config.WB_NEI_URL);
    if (res && res.data && res.data.result) {
      const result = res.data.result;

      result.forEach(item => {
        const tempObj = {
          id: item.id,
          name: item.name,
          className: item.className,
          description: item.description,
          path: item.path,
          creator: item.creator.realname,
          group: item.group.name,
          status: item.status.name,
        };
        if (!groupName || (groupName && (item.group.name === groupName))) {
          tableSource[item.className] = tableSource[item.className] ? tableSource[item.className].concat([tempObj]) : [tempObj];
        }
      });
      writeFileSync(`${__dirname}/../../data/facadeList.json`, JSON.stringify(tableSource), 'utf8');
      spinner.stop();
      return tableSource;
    }
    return false;
  }

  async fetchWBNeiDataDetailById(id) {
    if (!id) return false;
    const res = await axios.get(Config.WB_NEI_DETAIL_URL({id}));
    return res;
  }

  isExecPathRight() {
    const cwd = process.cwd();
    if (!existsSync(path.join(cwd, 'package.json'))) {
      log.error('请在 node 工程内使用');
      return false;
    }
    if (!existsSync(path.join(cwd, 'server')) || !existsSync(path.join(cwd, 'client'))) {
      log.error('执行失败: 请在项目根目录下执行');
      return false;
    }
    // 初始配置文件检查
    if (!existsSync(path.join(cwd, '.wbhelper.json'))) {
      // 一些初次使用的配置
      this.helper.spawn('cp', ['-f', path.resolve(__dirname, '../../data/wbHelperConfig.json'), path.join(cwd, '.wbhelper.json')]);
    }
    return true;
  }
}

module.exports = NeiCommand;