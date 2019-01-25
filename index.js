'use strict';

const path = require('path')
const Command = require('common-bin');
// const chalk = require('chalk');
// const figlet = require('figlet');

// console.log(
//   chalk.red(
//     figlet.textSync('Ever', {
//       horizontalLayout: 'fitted'
//     })
//   )
// );

class MainCommand extends Command {
  constructor(rawArgv) {
    super(rawArgv);
    this.yargs.usage('Usage: wbhelper <command> [options]');

    // register the entire directory to commands 注册所有继承 Command 指令
    this.load(path.join(__dirname, './lib/command'));
  }
}

module.exports = MainCommand;