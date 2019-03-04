'use strict';

const Command = require('common-bin');
const { writeFileSync, existsSync, readFileSync } = require('fs');
const log = require('../log');
const path = require("path");
const { prompt } = require('enquirer');
const Config = require('../config/new');

const {
  isTargetFolderExist
} = require('../file-generator');


class NewCommand extends Command {
  constructor(rawArgv) {
    super(rawArgv);
    this.yargs.usage('new');

    this.yargs.options({
      depth: {
        type: 'number',
        description: 'Create a shallow clone with a history truncated to the specified number of commits',
      },
    });
  }

  async run({ argv }) {
    // 执行目录检查
    if (!this.isExecPathRight()) return false;
    const wbhelperConfig = readFileSync(path.join(process.cwd(), '.wbhelper.json'), 'utf8');
    const { vue_config } = JSON.parse(wbhelperConfig);

    const { fileType } = await prompt(Config.codeTypeQuestion);
    const initAnswer = await prompt(Config.InitQuestion);

    this.handleWriteFile(initAnswer, fileType);
    console.log(initAnswer)
  }

  // TODO: 文件结构位置处理, 路径需自定义配置


  // TODO: 模板文件动态数据写入
  handleWriteFile({fileName, description, author}, fileType) {
    const cwd = process.cwd();
    const typeEnum = Config.typeEnum;

    if (!fileType || !typeEnum[fileType]) return;
    const wbhelperConfig = readFileSync(path.join(cwd, '.wbhelper.json'), 'utf8');
    const { vue_config } = JSON.parse(wbhelperConfig);
    // 检查并创建目标文件夹
    const dirPath = path.join(cwd, vue_config[typeEnum[fileType].route], fileName)
    const vueFilePath = path.join(dirPath, 'index.vue');

    const fileSource = {
      fileName,
      description,
      date: new Date(),
      author
    }
    try {
      isTargetFolderExist(dirPath);

      if (!existsSync(vueFilePath)) {
        writeFileSync(vueFilePath, typeEnum[fileType].tpl.call(this, fileSource), 'utf8');
        // 附加文件，当前仅限同目录下文件创建
        if (typeEnum[fileType].otherTpl && typeEnum[fileType].otherTpl.length) {
          typeEnum[fileType].otherTpl.forEach(item => {
            const filePath = path.join(dirPath, item.fileName);
            writeFileSync(filePath, item.tpl.call(this, fileSource), 'utf8');
            
            log.success(`${filePath} create 成功`);
          })
        }
        log.success(`${vueFilePath} create 成功`);
      }
    } catch (err) {
      log.error(`${vueFilePath} create 失败`);
    }
  }

  // TODO: 命名规范检查
  handleCheckFileName(name) {

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

  mkdirs(directory, callback) {
    const exists = existsSync(directory);
    if (exists) {
      callback();
    } else {
      mkdirs(path.dirname(directory), () => {
        mkdirSync(directory);
        callback();
      })
    }
  }

  get description() {
    return '快速生成通用模板代码文件';
  }
}

module.exports = NewCommand;