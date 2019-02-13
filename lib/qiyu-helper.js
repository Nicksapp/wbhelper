const axios = require('axios');
const qiyuConfig = require('./config/qiyu');
const { md5ByCrypto, sha1ByCrypto } = require("./utils");
const log = require('./log');

const qiyuHelper = {};

// 请求参数计算
const requestQueryParam = ( appKey, appSecret, requestJson ) => {
  const time = Math.round(new Date / 1000);
  const content = appSecret + md5ByCrypto(requestJson).toLowerCase() + time;
  const checksum = sha1ByCrypto(content);

  return {
    appKey,
    time,
    checksum
  };
}

/**
 * 给七鱼发送消息
 * @param {String} uid 用户 ID 必填
 * @param {String} msgType 消息类型 必填
 * @param {String} content 内容 必填
 * @param {Object} option 其他 选填
 */
qiyuHelper.postMessageToStaff = async (uid, msgType, content, option = {}) => {
  const reqData = {
    uid, msgType, content, ...option
  };
  const queryParam = requestQueryParam(qiyuConfig.APP_KEY_TEST, qiyuConfig.APP_SECRET_TEST, reqData);
  try {
    const { data } = await axios.post(qiyuConfig.postMessageToStaffUrl +
      `?appKey=${queryParam.appKey}&time=${queryParam.time}&checksum=${queryParam.checksum}`, reqData);
    if (data && data.code === 200) {} else {
      log.error('消息发送失败');
    }
  } catch (err) {
    log.error(err);
  }
}

/**
 * 请求分配客服
 * @param {String} uid 必填
 * @param {Object} option 选填
 */
qiyuHelper.requestApplyStaff = async (uid, option = {}) => {
  const reqData = {
    uid, ...option
  };
  const queryParam = requestQueryParam(qiyuConfig.APP_KEY_TEST, qiyuConfig.APP_SECRET_TEST, reqData);
  try {
    const { data } = await axios.post(qiyuConfig.requestApplyStaffUrl + 
      `?appKey=${queryParam.appKey}&time=${queryParam.time}&checksum=${queryParam.checksum}`, reqData);

    if (data && data.code === 200) {
      log.default(`sessionId: ${data.sessionId}; staffName: ${data.staffName}; staffId: ${data.staffId};`);
      log.success(data.message);
    } else {
      log.error(data.message);
    }
  } catch (err) {
    log.error(err);
  }
}

module.exports = qiyuHelper;