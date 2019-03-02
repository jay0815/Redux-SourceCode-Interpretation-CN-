/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */

export default function compose(...funcs) {
  // 当传入方法为 空时，返回传入参数
  if (funcs.length === 0) {
    return arg => arg
  }
  // dang传入方法 为 1时，返回当前方法
  if (funcs.length === 1) {
    return funcs[0]
  }
  // 当传入方法为 多个时，从右往左合并执行
  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}

// let a = (arg) => console.log('function a: arg * 1', arg * 1) || arg;
// let b = (arg) => console.log('function b: arg * 2', arg * 2) || arg * 2;
// let c = (arg) => console.log('function c: arg * 3', arg * 3) || arg * 3;
// let d = [a, b, c];
// let e = d.reduce((a, b) => (...arg) => a(b(...arg)));
