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
