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
    data: [],
    error: null,
  }); 
}
