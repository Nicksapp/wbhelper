const chalk = require('chalk');

exports.default = (msg) => {
  console.log(chalk.yellow(`${msg}`));
}

exports.success = (msg) => {
  console.log(chalk.green(`\u2714 ${msg}`))
}

exports.error = (msg) => {
  console.log(chalk.red(`\u2718 ${msg}`))
}