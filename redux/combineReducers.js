import ActionTypes from './utils/actionTypes'
import warning from './utils/warning'
import isPlainObject from './utils/isPlainObject'
// 根据key和action生成错误信息
function getUndefinedStateErrorMessage(key, action) {
  // 安全获取 action.type, 如果action不存在则返回为空
  const actionType = action && action.type
  // actionType 存在是返回 actionType， 不存在是 返回 ‘an action’
  const actionDescription =
    (actionType && `action "${String(actionType)}"`) || 'an action'
    //返回异常 message
  return (
    `Given ${actionDescription}, reducer "${key}" returned undefined. ` +
    `To ignore an action, you must explicitly return the previous state. ` +
    `If you want this reducer to hold no value, you can return null instead of undefined.`
  )
}
// 一些警告级别的错误
function getUnexpectedStateShapeWarningMessage(
  inputState,
  reducers,
  action,
  unexpectedKeyCache
) {
  // 获取所有reducer的键名
  const reducerKeys = Object.keys(reducers)
  //action 存在且 type 为 reducer 内置 值时，提示 预置值作为 参数传入了 createStore方法
  const argumentName =
    action && action.type === ActionTypes.INIT
      ? 'preloadedState argument passed to createStore'
      : 'previous state received by the reducer'
  // 当无reducers时
  if (reducerKeys.length === 0) {
    return (
      'Store does not have a valid reducer. Make sure the argument passed ' +
      'to combineReducers is an object whose values are reducers.'
    )
  }
  //当输入值 不为 原始对象时
  if (!isPlainObject(inputState)) {
    return (
      `The ${argumentName} has unexpected type of "` +
      {}.toString.call(inputState).match(/\s([a-z|A-Z]+)/)[1] +
      `". Expected argument to be an object with the following ` +
      `keys: "${reducerKeys.join('", "')}"`
    )
  }
  // 获取当前不存在与reducer 中 与 unexpectedKeyCache 中的
  const unexpectedKeys = Object.keys(inputState).filter(
    key => !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key]
  )
  // 将当前 不存在于 State中的 key进行缓存记录
  unexpectedKeys.forEach(key => {
    unexpectedKeyCache[key] = true
  })
  // 过滤 replaceReducer 方法可能带来的警告
  if (action && action.type === ActionTypes.REPLACE) return
  // 根据 异常数组 返回对应的提示
  if (unexpectedKeys.length > 0) {
    return (
      `Unexpected ${unexpectedKeys.length > 1 ? 'keys' : 'key'} ` +
      `"${unexpectedKeys.join('", "')}" found in ${argumentName}. ` +
      `Expected to find one of the known reducer keys instead: ` +
      `"${reducerKeys.join('", "')}". Unexpected keys will be ignored.`
    )
  }
}
// 校验 reducer 是否符合 redux 对reduer的定义
function assertReducerShape(reducers) {
  Object.keys(reducers).forEach(key => {
    const reducer = reducers[key]
    const initialState = reducer(undefined, { type: ActionTypes.INIT })
    // 初始化时的校验
    if (typeof initialState === 'undefined') {
      throw new Error(
        `Reducer "${key}" returned undefined during initialization. ` +
          `If the state passed to the reducer is undefined, you must ` +
          `explicitly return the initial state. The initial state may ` +
          `not be undefined. If you don't want to set a value for this reducer, ` +
          `you can use null instead of undefined.`
      )
    }
    // 非初始化时的校验
    if (
      typeof reducer(undefined, {
        type: ActionTypes.PROBE_UNKNOWN_ACTION()
      }) === 'undefined'
    ) {
      throw new Error(
        `Reducer "${key}" returned undefined when probed with a random type. ` +
          `Don't try to handle ${
            ActionTypes.INIT
          } or other actions in "redux/*" ` +
          `namespace. They are considered private. Instead, you must return the ` +
          `current state for any unknown actions, unless it is undefined, ` +
          `in which case you must return the initial state, regardless of the ` +
          `action type. The initial state may not be undefined, but can be null.`
      )
    }
  })
}

/**
 * Turns an object whose values are different reducer functions, into a single
 * reducer function. It will call every child reducer, and gather their results
 * into a single state object, whose keys correspond to the keys of the passed
 * reducer functions.
 *
 * @param {Object} reducers An object whose values correspond to different
 * reducer functions that need to be combined into one. One handy way to obtain
 * it is to use ES6 `import * as reducers` syntax. The reducers may never return
 * undefined for any action. Instead, they should return their initial state
 * if the state passed to them was undefined, and the current state for any
 * unrecognized action.
 *
 * @returns {Function} A reducer function that invokes every reducer inside the
 * passed object, and builds a state object with the same shape.
 */
export default function combineReducers(reducers) {

  if (!reducers) {
    warning(`No reducer exit"`)
  }
  // 获取 reducer 列表
  const reducerKeys = Object.keys(reducers)
  const finalReducers = {}
  // 过滤非function的 reducer
  for (let i = 0; i < reducerKeys.length; i++) {
    //获取当前reducer名
    const key = reducerKeys[i]

    if (process.env.NODE_ENV !== 'production') {
      if (typeof reducers[key] === 'undefined') {
        // 非正式环境且出现 reducer 为 undefined时
        warning(`No reducer provided for key "${key}"`)
      }
    }
    // 当 reducer 为 函数时，符合规范
    if (typeof reducers[key] === 'function') {
      // 将当前reduer置入
      finalReducers[key] = reducers[key]
    }
  }

  const finalReducerKeys = Object.keys(finalReducers)

  // This is used to make sure we don't warn about the same
  // keys multiple times.
  let unexpectedKeyCache // 定义异常reducer缓存
  if (process.env.NODE_ENV !== 'production') {
    // 非生产环境时清空 异常reducer缓存
    // 配合热更新 或者 开发者会主动去刷新页面（webpack --watch 是不会主动更新页面的）
    unexpectedKeyCache = {}
  }

  let shapeAssertionError // 初始化非法reducer的警告
  // 校验 reducer 是否符合 redux 对reduer的定义
  try {
    assertReducerShape(finalReducers)
  } catch (e) {
    shapeAssertionError = e
  }

  return function combination(state = {}, action) {
    // 发现 reducer 格式非法时 抛出异常
    if (shapeAssertionError) {
      throw shapeAssertionError
    }
    // 非生产环境，对reducer构建 过程中的问题，抛出warning
    // 校验 旧有 state， 当前的新reducer 集合对象， action 的合法性
    // 更新 unexpectedKeyCache
    if (process.env.NODE_ENV !== 'production') {
      const warningMessage = getUnexpectedStateShapeWarningMessage(
        state,
        finalReducers,
        action,
        unexpectedKeyCache
      )
      if (warningMessage) {
        warning(warningMessage)
      }
    }

    let hasChanged = false
    const nextState = {}
    for (let i = 0; i < finalReducerKeys.length; i++) {
      const key = finalReducerKeys[i] // 当前reduer的名称
      const reducer = finalReducers[key] // 当前reudcer 函数
      const previousStateForKey = state[key] // 旧state树
      const nextStateForKey = reducer(previousStateForKey, action) //当前reduer的新state树
      // 如果新state树不存在，则认定的 action 执行异常
      if (typeof nextStateForKey === 'undefined') {
        // 获取校验信息
        const errorMessage = getUndefinedStateErrorMessage(key, action)
        // 将校验信息抛出
        throw new Error(errorMessage)
      }
      // 构建新的 reducer 集合对象
      nextState[key] = nextStateForKey
      // 判断前后值是否发生改变
      // immutable 性
      // reduer的 diff 位置
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey
    }
    // 如果发生了改变则返回新的reducer集合
    return hasChanged ? nextState : state
  }
}
