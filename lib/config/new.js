const vueTpl = require('../TEMPLATE/vueTpl.hbs');
const billTableTpl = require('../TEMPLATE/billTableTpl.hbs');
const billTableConfigTpl = require('../TEMPLATE/billTableConfigTpl.hbs');
const Store = require('data-store');

module.exports = {
    typeEnum: {
        view: {
            tpl: vueTpl,
            route: 'view_placement'
        },
        component: {
            tpl: vueTpl,
            route: 'component_placement'
        },
        billTable: {
            tpl: billTableTpl,
            otherTpl: [{
                fileName: 'config.js',
                tpl: billTableConfigTpl
            }],
            route: 'billTable_placement'
        }
    },
    codeTypeQuestion: [{
        type: 'select',
        name: 'fileType',
        message: '请选择需要创建的文件类型:',
        choices: [
            'component',
            'view',
            {
                role: 'separator'
            }, // 分割线
            'billTable'
        ]
    }],
    InitQuestion: [{
        type: 'input',
        name: 'fileName',
        message: '请输入文件命名:',
        hint: '会校验文件命名,请用连字符\'-\'命名',
        validate(val) {
            if (val) {
                return val ? true : '错误';
            }
        }
    }, {
        type: 'input',
        name: 'description',
        message: '请输入简要描述:',
        validate(val) {
            if (val) {
                return val ? true : '错误'
            }
        }
    }, {
        type: 'input',
        name: 'author',
        message: '请输入作者:',
        validate(val) {
            if (val) {
                return val ? true : '错误'
            }
        },
        history: {
            store: new Store({
                path: `${__dirname}/../../data/temp/newCache.json`
            }),
            autosave: true
        },
    }]
}