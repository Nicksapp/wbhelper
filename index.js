'use strict';

const path = require('path')
const Command = require('common-bin');
const chalk = require('chalk');
const figlet = require('figlet');
const Store = require('data-store');
const pkg = require('./package.json');
const { mkdirs } = require('./lib/file-generator');

console.log(
  chalk.red(
    figlet.textSync('WBHelper', {
      horizontalLayout: 'fitted'
    })
  )
);

class MainCommand extends Command {
  constructor(rawArgv) {
    super(rawArgv);
    this.yargs.usage('Usage: wbhelper <command> [options]');

    // register the entire directory to commands 注册所有继承 Command 指令
    this.load(path.join(__dirname, './lib/command'));
    this.versionCheck();
    
  }

  versionCheck() {
    let qiyuCache;
    mkdirs(path.join(__dirname, './data/temp/'), () => {
      qiyuCache = new Store({
        path: `${__dirname}/./data/temp/cacheVersion.json`
      });
    });

    const versionData = qiyuCache.get(pkg.name);
    if (versionData) {
      if (Date.now() - versionData.lastCheck > 1000 * 3600 * 24) {
        this._checkUpdate();
      }
    } else {
      this._checkUpdate()
    }
  }

  _checkUpdate() {
    try {
      this.helper.spawn(
        process.execPath,
        [require('path').join(__dirname, './lib/checkUpdate.js'), JSON.stringify({
          'name': pkg.name, // package 信息
          'version': pkg.version,
          'registry': 'https://registry.npmjs.org',
          'updateMessage': 'Package update available: <%=colors.dim(current)%> -> <%=colors.green(latest)%> \nRun <%=colors.cyan(command)%> to update',
          'level': 'minor' // 自定义强制更新的版本更新级别，默认是 major
        })]);
    } catch (e) {}
  }
}

module.exports = MainCommand;