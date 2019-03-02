// A basic Flux Standard Action  https://github.com/redux-utilities/flux-standard-action
function createThunkMiddleware(extraArgument) {
// return store => dispatch => action
  return ({ dispatch, getState }) => next => action => {
    // action 为 非plain object 时，继续执行
    if (typeof action === 'function') {
      return action(dispatch, getState, extraArgument);
    }
    // 当action 为 plain object 时, 使用 dispatch 传送 action 给store
    return next(action);
  };
}

const thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

export default thunk;

//详细实现逻辑
//redux - createStore.js | line:60
// first way:
// compose(applyMiddleware(thunk) 作为增强器参数直接传入
// const store = createStore(reducer, compose(applyMiddleware(thunk)));
//
// second way:
// compose(applyMiddleware(thunk))(createStore) 得到一个增强后的createStore 方法
// const enHanceCreateStore = compose(applyMiddleware(thunk))(createStore);
// const store = enHanceCreateStore(rootReducer);
//
// applyMiddleware.js | line:19
// applyMiddleware(thunk) 是一个 enhancer, thunk 只是中间件，
// applyMiddleware 只是 store enhancer 的一个实现范式
//
// enhancer : (...middlewares) => (createStore) => (...args) => ({ ...store, dispatch })
// ...args: reducer\preState\enhancer
