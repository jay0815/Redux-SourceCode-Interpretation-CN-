import compose from './compose'

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 */
export default function applyMiddleware(...middlewares) {
  // 可以接受一个 createStore 方法 为参数，并对 返回的 dispatch 做包装的 store
  return createStore => (...args) => {
    args[0] = reducers
    args[1] = preloadState
    // 创建一个 store
    const store = createStore(...args)
    // 当创建 你的 中间件时，不允许 dispatching
    // 其它的中间件不能 应用此 dispatch 方法
    let dispatch = () => {
      throw new Error(
        `Dispatching while constructing your middleware is not allowed. ` +
          `Other middleware would not be applied to this dispatch.`
      )
    }
    // 暴露getState 和 dispatch 给 middleware 用
    const middlewareAPI = {
      getState: store.getState,
      dispatch: (...args) => dispatch(...args)
    }
    // 给每个中间件 提供 getState 和 dispatch 方法
    const chain = middlewares.map(middleware => middleware(middlewareAPI))
    // 中间件将以从下至上的顺序执行
    // 给每个中间件的第二个参数(next)传值 为 dispatch
    dispatch = compose(...chain)(store.dispatch)

    return {
      ...store,
      dispatch
    }
  }
}
