const Table = require('cli-table');
const chalk = require('chalk');
const crypto = require('crypto');

exports.listTable = (tplList, lyric) => {
  const list = Object.keys(tplList);
  const table = new Table({
    head: ['客服', 'StaffId', 'SessionId'],
    style: {
      head: ['green']
    }
  })
  if (list.length) {
    list.forEach((key) => {
      table.push(
        [
          tplList[key]['客服'], 
          tplList[key]['StaffId'],
          tplList[key]['SessionId'],
        ]
      )
      if (table.length === list.length) {
        console.log(table.toString())
        if (lyric) {
          console.log(chalk.green(`\u2714 ${lyric}`))
        }
        process.exit()
      }
    })
  } else {
    console.log(table.toString())
    if (lyric) {
      console.log(chalk.green(`\u2714 ${lyric}`))
    }
    process.exit()
  }
}

exports.md5ByCrypto = (input) => {
  return crypto.createHash('md5').update(JSON.stringify(input)).digest('hex');
}

exports.sha1ByCrypto = (input) => {
  return crypto.createHash('sha1').update(input).digest('hex');
}