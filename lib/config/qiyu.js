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
  mockWsMessageInUrl: (sessionId) => `http://ws.cswb-kl.netease.com/home?sessionId=${sessionId}`
}