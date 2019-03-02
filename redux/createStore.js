import $$observable from 'symbol-observable'

import ActionTypes from './utils/actionTypes'
import isPlainObject from './utils/isPlainObject'

/**
 * Creates a Redux store that holds the state tree.
 * The only way to change the data in the store is to call `dispatch()` on it.
 *
 * There should only be a single store in your app. To specify how different
 * parts of the state tree respond to actions, you may combine several reducers
 * into a single reducer function by using `combineReducers`.
 *
 * @param {Function} reducer A function that returns the next state tree, given
 * the current state tree and the action to handle.
 *
 * @param {any} [preloadedState] The initial state. You may optionally specify it
 * to hydrate the state from the server in universal apps, or to restore a
 * previously serialized user session.
 * If you use `combineReducers` to produce the root reducer function, this must be
 * an object with the same shape as `combineReducers` keys.
 *
 * @param {Function} [enhancer] The store enhancer. You may optionally specify it
 * to enhance the store with third-party capabilities such as middleware,
 * time travel, persistence, etc. The only store enhancer that ships with Redux
 * is `applyMiddleware()`.
 *
 * @returns {Store} A Redux store that lets you read the state, dispatch actions
 * and subscribe to changes.
 */ store
export default function createStore(reducer, preloadedState, enhancer) {
  // Reducer 函数只是一个纯函数，它接收应用程序的当前状态以及发生的 action，然后返回修改后的新状态（或者有人称之为归并后的状态）
  // reducer 常见: (state, action) => { switch (xxx) {  case expression: break; default: break; } } 或者 (state, action) => { actionType: (state) => State } 等形式
  // enhancers 非法传入
  // preloadedState 且 enhancer 均为 方法
  // enhancer 为 方法且存在第四个传入 的 方法参数
  if (
    (typeof preloadedState === 'function' && typeof enhancer === 'function') ||
    (typeof enhancer === 'function' && typeof arguments[3] === 'function')
  ) {
    throw new Error(
      'It looks like you are passing several store enhancers to ' +
        'createStore(). This is not supported. Instead, compose them ' +
        'together to a single function'
    )
  }
  // 当 preloadedState 为方法 enhancer 为undefined时, 将初始 state赋值给 enhancer 并 清空 preloadedState
  // 对 enhancer (middleware) 提供兼容使用
  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState
    preloadedState = undefined
  }
  // 当 enhancer 存在时
  if (typeof enhancer !== 'undefined') {
    // enhancer 不为方法时
    if (typeof enhancer !== 'function') {
      throw new Error('Expected the enhancer to be a function.')
    }
    //  使用enhancer 对 createStore 进行包装,并重新生成一个 store
    return enhancer(createStore)(reducer, preloadedState)
  }
  // 当 reducer 不是方法是，说明 reducer 是通过非法方式 传入的
  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.')
  }
  // 备份 当前 的 reducer, starte
  let currentReducer = reducer
  let currentState = preloadedState
  let currentListeners = [] //监听函数列表
  let nextListeners = currentListeners // 建立监听列表的引用
  let isDispatching = false // 是否正在dispatch

  /**
   * This makes a shallow copy of currentListeners so we can use
   * nextListeners as a temporary list while dispatching.
   *
   * This prevents any bugs around consumers calling
   * subscribe/unsubscribe in the middle of a dispatch.
   */
  // 当前后 监听列表一致时, 取消引用关系
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice()
    }
  }

  /**
   * Reads the state tree managed by the store.
   *
   * @returns {any} The current state tree of your application.
   */
  // 返回当前state树
  function getState() {
    // 当reducer方法执行中时不允许调用 getState
    // 保证流程的安全（确保整体数据的immutable 性）
    if (isDispatching) {
      throw new Error(
        'You may not call store.getState() while the reducer is executing. ' +
          'The reducer has already received the state as an argument. ' +
          'Pass it down from the top reducer instead of reading it from the store.'
      )
    }

    return currentState
  }

  // 添加注册一个监听函数
  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected the listener to be a function.')
    }

    if (isDispatching) {
      throw new Error(
        'You may not call store.subscribe() while the reducer is executing. ' +
          'If you would like to be notified after the store has been updated, subscribe from a ' +
          'component and invoke store.getState() in the callback to access the latest state. ' +
          'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.'
      )
    }
    // 此处 isSubscribed 为闭包用法,只要 store 不重置，则 isSubscribed 始终存在与当前内存中
    let isSubscribed = true
    // 此处通过slice拷贝, 重新对监听队列赋值
    ensureCanMutateNextListeners()
    // 加入性的监听
    nextListeners.push(listener)
    // 返回一个可以取消此监听的方法
    return function unsubscribe() {
      // 如果没有注册，则不执行任何操作
      if (!isSubscribed) {
        return
      }
      // 当reducer为执行中，不允许执行监听中断操作
      if (isDispatching) {
        throw new Error(
          'You may not unsubscribe from a store listener while the reducer is executing. ' +
            'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.'
        )
      }
      // 修改监听状态
      isSubscribed = false
      // 同145行
      ensureCanMutateNextListeners()
      // 获取当前监听器在队列中的位置
      const index = nextListeners.indexOf(listener)
      // 清除当前的监听器
      nextListeners.splice(index, 1)
    }
  }

  // store接受aciton时，提供给外部的传递方法
  function dispatch(action) {
    //校验action是否为原型对象
    if (!isPlainObject(action)) {
      throw new Error(
        'Actions must be plain objects. ' +
          'Use custom middleware for async actions.'
      )
    }
    // 校验 action对象是否有 type属性
    // Flux Standard Action
    if (typeof action.type === 'undefined') {
      throw new Error(
        'Actions may not have an undefined "type" property. ' +
          'Have you misspelled a constant?'
      )
    }
    // 当有reducer正在执行时，不予许执行其他的action
    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.')
    }
    // 执行action
    try {
      //reducer 执行转态改为任务进行中
      isDispatching = true
      //reducer 传入preState 和当前 action, 获取最新 State树
      currentState = currentReducer(currentState, action)
    } finally {
      //reducer 执行转态改为无任务执行
      isDispatching = false
    }
    // 更新 currentListeners 监听列表
    // 同步 listeners 为最新的 监听列表
    const listeners = (currentListeners = nextListeners)
    // 调用队列中各个监听器
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i]
      listener()
    }
    // 返回action (plain object)
    return action
  }

  /**
   * Replaces the reducer currently used by the store to calculate the state.
   *
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   *
   * @param {Function} nextReducer The reducer for the store to use instead.
   * @returns {void}
   */
  // 当前的reducer，支持用过store.replaceReducer方式动态替换reducer，为代码热替换提供了可能
  // replaceReducer是替换当前的reducer的函数，replaceReducer接受一个新的reducer，替换完成之后，会执行 dispatch({ type: ActionTypes.REPLACE }) ，
  // 用来初始化store的状态。官方举出了三种replaceReducer的使用场景，分别是：   
  // 1、当你的程序要进行代码分割的时候   
  // 2、当你要动态的加载不同的reducer的时候   
  // 3、当你要实现一个实时reloading机制的时候
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.')
    }

    currentReducer = nextReducer

    // This action has a similiar effect to ActionTypes.INIT.
    // Any reducers that existed in both the new and old rootReducer
    // will receive the previous state. This effectively populates
    // the new state tree with any relevant data from the old one.
    //
     // reducer 函数结构的·更新
     // state 保留原本的
    dispatch({ type: ActionTypes.REPLACE })
  }

  /**
   * Interoperability point for observable/reactive libraries.
   * @returns {observable} A minimal observable of state changes.
   * For more information, see the observable proposal:
   * https://github.com/tc39/proposal-observable
   */
  function observable() {
    const outerSubscribe = subscribe
    return {
      /**
       * The minimal observable subscription method.
       * @param {Object} observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * @returns {subscription} An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       */
      subscribe(observer) {
        if (typeof observer !== 'object' || observer === null) {
          throw new TypeError('Expected the observer to be an object.')
        }

        function observeState() {
          if (observer.next) {
            observer.next(getState())
          }
        }

        observeState()
        const unsubscribe = outerSubscribe(observeState)
        return { unsubscribe }
      },

      [$$observable]() {
        return this
      }
    }
  }

  // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.
  dispatch({ type: ActionTypes.INIT })

  return {
    dispatch,
    subscribe,
    getState,
    replaceReducer,
    [$$observable]: observable
  }
}
