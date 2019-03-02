/**
 * @param {any} obj The object to inspect.
 * @returns {boolean} True if the argument appears to be a plain object.
 */
/**
 * 判断对象 是否 是原始对象
 * @param  {[type]}  obj [description]
 * @return {Boolean}     [description]
 */
export default function isPlainObject(obj) {
  // 如果对象为空 或者 不为 对象时，返回 false
  if (typeof obj !== 'object' || obj === null) return false

  let proto = obj
  // 当proto为obj原型时结束循环
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }
  // 判断当前对象 是 通过字面量方式 或者 Object构造函数的方式生成的对象
  // 其中 Object.create(null) 时， proto === null
  // Object.create({}) 时， proto === Object.prototype 即 JS中 Object 对象本身
  return Object.getPrototypeOf(obj) === proto
}
