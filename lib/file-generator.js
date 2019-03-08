const path = require("path");
const log = require('../lib/log');
const { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs');
const Handlebars = require('handlebars');
const hbsHelper = require('./hbs-helper');

const controllerTPL = require('../lib/TEMPLATE/controllerTpl.hbs');
const serviceTPL = require('../lib/TEMPLATE/serviceTpl.hbs');
const apiTPL = require('../lib/TEMPLATE/apiTpl.hbs');
const apiIndexTPL = require('../lib/TEMPLATE/apiIndexTpl.hbs');
const routerTPL = require('../lib/TEMPLATE/routerTpl.hbs');

const fileGenerator = {};
const filePathComputed = ({type, fileName}) => {
  const wbhelperConfig = readFileSync(path.join(process.cwd(), '.wbhelper.json'), 'utf8');
  const { nei_config } = JSON.parse(wbhelperConfig);
  const pathTypeEnumConfig = {
    'api': {
      path: `${nei_config.api_placement}/${fileName}.js`
    },
    'router': {
      path: `${nei_config.router_placement}/wb_nei.ts`
    },
    'controller': {
      path: `${nei_config.controller_placement}/${fileName}.ts`
    },
    'service': {
      path: `${nei_config.service_placement}/${fileName}.ts`
    }
  };
  
  Object.keys(pathTypeEnumConfig).forEach(type => {
    fileGenerator.isTargetFolderExist(nei_config[`${type}_placement`]);
  });
  return path.join(process.cwd(), pathTypeEnumConfig[type]['path']);
};

// 文件写入
fileGenerator.handleWriteFile = (targetData, fileName, type) =>{
  const typeEnum = {
    controller: controllerTPL,
    service: serviceTPL,
    api: apiTPL,
  }
  targetData.isInit = true;
  const tsFileContent = typeEnum[type] && typeEnum[type].call(null, targetData);
  const filePath = filePathComputed({fileName, type});
  try {
    writeFileSync(filePath, tsFileContent, 'utf8');
    log.success(`/${type}/${fileName}.${type === 'api' ? 'js':'ts'} 文件 create 成功`);
  } catch (err) {
    log.error(`/${type}/${fileName}.${type === 'api' ? 'js':'ts'} 文件 create 失败： ${err}`)
  }
}

// 文件内容替换, status: on => replace, off => 跳过, other => 插入, 支持 controlle、service
fileGenerator.handleFileContentReplace = (targetData, fileStatus, fileName, type) => {
  if (!targetData || !fileStatus || !fileName || !type) {
    log.error('handleFileContentReplace error');
    return;
  }
  const typeEnum = {
    controller: controllerTPL,
    service: serviceTPL,
    api: apiTPL,
  }
  const regEnum = {
    controller: 'async',
    service: 'public',
    api: 'export'
  }

  if (!typeEnum[type]) {
    log.error('暂不支持此类文件，请不要继续尝试了');
    return;
  }
  // status 为 on 的 pathname
  const fileStatusOn = Object.keys(fileStatus).filter(item => fileStatus[item] === 'on');
  // status 为 off 的 pathname
  const fileStatusOff = Object.keys(fileStatus).filter(item => fileStatus[item] !== 'on');
  // status 为 on 的渲染 data
  const extTargetDataOn = targetData.data.filter(item => fileStatusOn.includes(item.path));
  // 没有 status 的渲染 data
  const extTargetDataNull = targetData.data.filter(item => !fileStatusOn.concat(fileStatusOff).includes(item.path));

  // 已存在 api
  if (extTargetDataOn && extTargetDataOn.length) {
    extTargetDataOn.forEach(item => {
      item.isMethodInit = false;
      item.className = targetData.className;
      const filePath = filePathComputed({fileName, type});
      const reg = new RegExp(regEnum[type]+'[\\w\\s]*\\s'+item.path+'\\(.*\\)(?:.|\\n)+?\\}(\\n|\\s+)$', 'gm');
      
      let targetFile = readFileSync(filePath, 'utf8');
      // 转换指定代码
      const replaceTargetFileContent = targetFile && targetFile.replace(reg, typeEnum[type].call(null, item));
      // 文件写入
      try {
        replaceTargetFileContent && writeFileSync(filePath, replaceTargetFileContent, 'utf8');
        log.success(`/${type}/${fileName}.${type === 'api' ? 'js':'ts'} 文件 rewrite 成功,关联 api ${item.path}`);
      } catch (err) {
        log.error(`/${type}/${fileName}.${type === 'api' ? 'js':'ts'} 文件 rewrite 失败: ${err}`)
      }
    });
  }
  // 新增 api
  if (extTargetDataNull && extTargetDataNull.length) {
    const reg = new RegExp(`(.|\n)(\n|\s+)(\}$)`, 'gm');
    extTargetDataNull.forEach(item => {
      item.isMethodInit = true;
      item.className = targetData.className;
      const filePath = filePathComputed({fileName, type});
      let targetFile = readFileSync(filePath, 'utf8');
      // 转换指定代码
      let replaceTargetFileContent;
      if (type === 'api') {
        replaceTargetFileContent = targetFile && targetFile.concat(`${typeEnum[type].call(null, item)}`);
      } else {
        replaceTargetFileContent = targetFile && targetFile.replace(reg, `$1${typeEnum[type].call(null, item)}\n$3`);
      }
      // 文件写入
      try {
        replaceTargetFileContent && writeFileSync(filePath, replaceTargetFileContent, 'utf8');
        log.success(`/${type}/${fileName}.${type === 'api' ? 'js':'ts'} 文件 add 写入成功,关联 api ${item.path}`);
      } catch (err) {
        log.error(`/${type}/${fileName}.${type === 'api' ? 'js':'ts'} 文件 add 失败: ${err}`)
      }
    })
  }

}

// 检查文件夹所有内容 支持 controlle、service、api
fileGenerator.verifyDirStatus = async (pathname, className, type) => {
  try {
    const regEnum = {
      controller: 'async',
      service: 'public async',
      api: 'export function'
    }
    const fileName = className;
    const extDir = await readdirSync(pathname);
    const existFile = extDir.find(file => file && (file.split('.')[0] === fileName));

    if (existFile) {
      const fileData = await readFileSync(path.resolve(pathname, `${existFile}`), 'utf8');
      // 检查文件，判断是否关闭 wbNei 的控制，获得 wbneicontrol 为 on 的 methods
      let isFileStatusExistList = fileGenerator.verifyFileOnControl(fileData, {
        reg: /\/\* wbneicontrol:\s*(\w+)\s*\*\/\n.*\s(\w+).*\(.*\)/gm
      });
      if (!type) return isFileStatusExistList;

      const reg = new RegExp(`${regEnum[type]}\\s+(\\w+)\\(.*\\)\\s*\\{`, 'gm')
      // 检查文件，检查文件已存在方法名配置
      let isAreadyMethodExistList = fileGenerator.handleScanFileMethod(fileData, {
        reg
      });
      const isFileStatusNullList = Object.values(isAreadyMethodExistList).filter(item => {
        return !Object.keys(isFileStatusExistList).includes(item);
      })
      isFileStatusNullList.forEach(i => {
        isFileStatusExistList[i] = 'off'
      })
      return isFileStatusExistList;
    }
    return;
  } catch (err) {
    log.error(err)
    // 如果不存在文件夹
  }
}

// 文件 check, 支持 controlle、service、api
fileGenerator.verifyFileOnControl = (data, { reg }) => {
  if (!data) return;
  let verifyFile;
  let verifyFileResult = [];
  let result = {};

  while ((verifyFile = reg.exec(data)) !== null) {
    verifyFileResult = verifyFileResult.concat(verifyFile);
  };
  for (let i in verifyFileResult) {
    if (i % 3 === 2) {
      result[verifyFileResult[i]] = verifyFileResult[i - 1];
    }
  }
  return result;
}

// Scan 文件中所有已存在的方法状态,提供对于人工代码文件的写入支持
fileGenerator.handleScanFileMethod = (data, { reg }) => {
  if (!data) return;
  let verifyFile;
  let verifyFileResult = [];
  let result = {};

  while ((verifyFile = reg.exec(data)) !== null) {
    verifyFileResult = verifyFileResult.concat(verifyFile);
  };
  for (let i in verifyFileResult) {
    if (i % 2 === 1) {
      result[verifyFileResult[i - 1]] = verifyFileResult[i];
    }
  }
  return result;
}

// router.ts 代码生成
fileGenerator.handleRouterGenerate = (targetData, fileName = 'router') => {
  const filePath = filePathComputed({fileName, type: 'router'});
  try {
    if (!existsSync(filePath)) { // 不存在 router.ts 直接写入
      targetData.isInit = true;
      writeFileSync(filePath, routerTPL(targetData), 'utf8');
      log.success(`/${fileName}.ts 文件 create 成功`);
    } else { // 判断已存在路由信息
      let targetFile = readFileSync(filePath, 'utf8');
      const fileStatus = fileGenerator.verifyFileOnControl(targetFile, {
        reg: /controller.wbnei.(\w+).(\w+)/gm
      });
      const existFacadePathArr = Object.keys(fileStatus).map(item => {
        return {
          className: fileStatus[item],
          path: item
        }
      }).filter(item => item.className === targetData.className).map(item => item.path);
      targetData.data = targetData.data.filter(item => {
        return !existFacadePathArr.includes(item.path)
      })
      targetData.isInit = false;
      // 转换指定代码
      const replaceTargetFileContent = targetFile && targetFile.replace(/(.|\n)(\n|\s+)(\}$)/gm, `$1${routerTPL(targetData)}\n$3`);
      writeFileSync(filePath, replaceTargetFileContent, 'utf8');
      log.success(`/${fileName}.ts 文件 write 成功`);
    }
  } catch (err) {
    log.error(`/${fileName}.ts 文件编辑失败： ${err}`)
  }
}

// api Index 文件生成，每次都会扫描 api 文件内容生成
fileGenerator.handleGenerateApiIndex = () => {
  const cwd = process.cwd();
  const wbhelperConfig = readFileSync(path.join(cwd, '.wbhelper.json'), 'utf8');
  const { nei_config } = JSON.parse(wbhelperConfig);

  fileGenerator.isTargetFolderExist(path.join(cwd, nei_config.api_placement));

  const apiDirPath = path.join(cwd, nei_config.api_placement);
  const apiDirContent = readdirSync(apiDirPath);
  
  const computedFileExist = apiDirContent.filter(i => i !== 'index.js').map(i => { 
    return { facadeName: i.split('.')[0] }
  });
  try {
    writeFileSync(path.join(apiDirPath, 'index.js'), apiIndexTPL({ data: computedFileExist }), 'utf8');
  } catch (err) {
    log.error(`api Index 生成失败: ${err}`)
  }
}

// 判断指定目录文件夹是否存在，没有则会自动 make 一个
fileGenerator.isTargetFolderExist = (directory) => {
  try {
    const exists = existsSync(directory);
    if (exists) {
      return true;
    } else {
      fileGenerator.mkdirs(path.dirname(directory), () => {
        mkdirSync(directory);
        return true;
      })
    }
  } catch (err) {
    log.error(`文件目录创建失败: ${err}`);
  }
}

// 递归判断文件夹是否存在，不存在自动创建
fileGenerator.mkdirs = (directory, callback) => {
  try {
    const exists = existsSync(directory);
    if (exists) {
      callback();
    } else {
      fileGenerator.mkdirs(path.dirname(directory), () => {
        mkdirSync(directory);
        callback();
      })
    }
  } catch (err) {
    log.error(`文件目录创建失败: ${err}`)
  }
}

module.exports = fileGenerator;