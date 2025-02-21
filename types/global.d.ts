interface KV<V> {
  key: string;
  value: V;
}
/**
 * 任意的对象类型 key 为 string，value 可为任意类型
 */
interface AnyObj {
  [key: string]: any;
}

/**
 * 默认 async/await 返回类型
 */
interface PromiseReturnType<T> {
  /**
   * 成功时返回的数据
   */
  data: T | null;
  /**
   * 失败时返回的错误
   */
  error: ApiProblem | null;
}
