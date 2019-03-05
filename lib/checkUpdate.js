const Store = require('data-store');
const axios = require('axios');
const opts = JSON.parse(process.argv[2]);
const updater = require('pkg-updater');

let lastVersion = '';
let qiyuCache = new Store({
    path: `${__dirname}/../data/cacheVersion.json`
});

// 发送请求获取最新版本
const url = `${opts.registry}/${opts.name}/${opts.tag || 'latest'}`;
axios.get(url).then(res => {
    if (res && res.data && res.data.version) {
        lastVersion = res.data.version;
    }

    // 如果获取失败了，最新版本就是当前版本（package.version）
    if (!lastVersion) {
        lastVersion = opts.version;
    }
    let data = qiyuCache.get(opts.name);

    !data && (data = {});

    if (!data[opts.name]) {
        data[opts.name] = {};
    }
    data[opts.name].lastVersion = lastVersion; // 最新版本
    data[opts.name].lastCheck = Date.now(); // 检查时间
    // 写入缓存
    qiyuCache.set(opts.name, data[opts.name]);
    const type = updater.diffType(opts.version, lastVersion, opts.level);

    if (type) {
        // 根据模板渲染提示信息
        const str = updater.template(opts.updateMessage || updater.defaultOpts.updateMessage)({
            'colors': updater.colors,
            'name': opts.name,
            'current': opts.version,
            'latest': lastVersion,
            'command': 'npm i -g ' + opts.name
        });
        // 进行提示
        console.log(
            updater.boxen(str, {
                'padding': 1,
                'margin': 1,
                'borderStyle': 'classic'
            })
        );
    }
}).catch(e => {
    console.log(e);
})

