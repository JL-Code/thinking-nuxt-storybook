/**
 * 获取游戏树
 * @returns 游戏树
 */
export async function listGameAsTree() {
  return Promise.resolve({
    data: [],
    error: null,
  });
}

/**
 * 根据游戏id获取服务器树
 * @param gameId 游戏id
 * @returns 服务器树
 */
export async function listServerAsTreeByGameId(gameId: number) {
  return Promise.resolve({
    data: [ {
      id: 1,
      parentId: 1,
      name: "欧区",
      type: "region",
      typeName: "大区",
      hot: true,
      initial: "E",
      sort: 1,
      children: [{
        id: 11,
        parentId: 1,
        name: "欧服",
        type: "server",
        typeName: "服务器",
        hot: true,
        initial: "E",
      }],
    }],
    error: null,
  }); 
}
