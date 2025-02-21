/**
 * Urls 工具函数
 * @see https://github.com/authts/oidc-client-ts/blob/9ccae8f87b3e9e2df349aaf6f007964ced287b02/src/utils/UrlUtils.ts
 * @internal
 */
export default class Urls {
  /**
   * 读取 url 参数
   * @param url 网页地址
   * @param responseMode 响应模式，eg: query|fragment 默认 query
   * @returns url 参数
   */
  public static readParams(
    url: string,
    responseMode: "query" | "fragment" = "query"
  ): URLSearchParams {
    if (!url) throw new TypeError("Invalid URL");
    // the base URL is irrelevant, it's just here to support relative url arguments
    const parsedUrl = new URL(url, "http://127.0.0.1");
    const params = parsedUrl[responseMode === "fragment" ? "hash" : "search"];
    return new URLSearchParams(params.slice(1));
  }

  /**
   * 添加参数
   * @param key 参数键
   * @param value 参数值
   * @param href 当前url，默认为 window.location.href
   * @param replace 替换 url，默认为 true
   */
  public static addParam(
    key: string,
    value: string,
    href = window.location.href,
    replace = true
  ) {
    const url = new URL(href);
    url.searchParams.set(key, value);
    // 替换当前历史记录
    if (replace) {
      window.history.replaceState({}, "", url);
    } else {
      window.history.pushState({}, "", url);
    }
  }

  /**
   * 删除参数
   * @param key 参数键
   * @param href 当前url，默认为 window.location.href
   * @param replace 替换 url，默认为 true
   */
  public static removeParam(
    key: string,
    href = window.location.href,
    replace = true
  ) {
    const url = new URL(href);
    url.searchParams.delete(key);
    // 替换当前历史记录
    if (replace) {
      window.history.replaceState({}, "", url);
    } else {
      window.history.pushState({}, "", url);
    }
  }
}
