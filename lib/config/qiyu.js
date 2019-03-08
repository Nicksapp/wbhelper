const Store = require('data-store');

module.exports = {
  APP_KEY_TEST: 'f41f46b439d4253e983c845857ad6862',
  APP_SECRET_TEST: 'A067B333A7F547F79F2BBB250320407E',
  APP_KEY_ONLINE: 'b913ae6b99bda9953783f16cda73ee14',
  APP_SECRET_ONLINE: '56546094A9904DEFBAEC7CF6D9D38CC9',

  // 给七鱼发送消息 ?appKey=1064deea1c3624c9ee26d1de5ce8481f&time=1463216914&checksum=e72be4487b6fc03e0f914fc11e4053d771598d93
  postMessageToStaffUrl: 'http://qiyukf.netease.com/openapi/message/send',
  // 请求分配客服 ?appKey=1064deea1c3624c9ee26d1de5ce8481f&time=1463217187&checksum=2f13932c4b7c6888b12360a85261a11b8b543f64
  requestApplyStaffUrl: 'http://qiyukf.netease.com/openapi/event/applyStaff',
  // 给七鱼发送消息 
  postMessageToStaffUrlPro: 'https://qiyukf.com/openapi/message/send',
  // 请求分配客服 
  requestApplyStaffUrlPro: 'https://qiyukf.com/openapi/event/applyStaff',
  // 模拟 ws 传递信息进来
  mockWsMessageInUrl: (sessionId) => `http://ws.cswb-kl.netease.com/home?sessionId=${sessionId}`,

  questionConfig: [{
    type: 'input',
    name: 'staffId',
    message: '请输入需要接入的客服 Id:',
    header: '七鱼系统来访会话模拟配置',
    hint: '请输入已处于在线状态的客服 ID',
    history: {
      store: new Store({
        path: `${__dirname}/../../data/temp/qiyu_staffId.json`
      }),
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
    message: '请选择希望模拟接入的用户数, 默认为 3 个, 最大支持 100 个（每秒进一个）',
    initial: 3,
    validate(val) {
      if (+val && typeof + val === 'number') {
        return +val > 100 ? '当前限制最大同时接入 100 个用户' : true;
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
      if (val) {
        return +val < 1000 ? '当前限制最小值为 1000ms' : true;
      }
    }
  }, {
    type: 'input',
    name: 'fromTitle',
    float: false,
    message: '用户发起咨询客服操作的页面的标题',
    initial: '订单详情',
    hint: 'fromTitle 参数设置'
  }, {
    type: 'input',
    name: 'keywords',
    float: false,
    message: '模拟消息中希望出现的关键词,将会在消息中随机插入指定的关键词',
    hint: '关键词请用英文逗号间隔',
    initial: '测试'
  }]
}