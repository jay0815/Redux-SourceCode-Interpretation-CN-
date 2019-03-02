/**
 * These are private action types reserved by Redux.
 * For any unknown actions, you must return the current state.
 * If the current state is undefined, you must return the initial state.
 * Do not reference these action types directly in your code.
 */

/**
 * 获取 0.0 ~ 1.0 间的一个随机数
 * 转化成 36进制
 * 截取 7 位以后的内容
 * 转化为数组
 * 转化为字符串
 */
const randomString = () =>
  Math.random()
    .toString(36)
    .substring(7)
    .split('')
    .join('.')

/**
 * [randomString]
 * 防止使用者 使用 以下 action types
 */

const ActionTypes = {
  INIT: `@@redux/INIT${randomString()}`,
  REPLACE: `@@redux/REPLACE${randomString()}`,
  PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`
}

export default ActionTypes
