const apiBase = "http://test.bijiaqi.com";

/**
 * 获取游戏树
 * @param mock 是否为 mock 数据
 * @returns 游戏树
 */
export async function listGameAsTree(mock: boolean = false) {
  if (mock) {
    return Promise.resolve<PromiseReturnType<GamePicker.TreeNodeVO[]>>({
      data: [],
      error: null,
    });
  } else {
    const list = await $fetch<GamePicker.TreeNodeVO[]>(
      `${apiBase}/api/v1/any/shop/home/games`,
      {
        method: "POST",
        body: {},
      }
    );

    return Promise.resolve<PromiseReturnType<GamePicker.TreeNodeVO[]>>({
      data: list,
      error: null,
    });
  }
}

/**
 * 根据游戏id获取服务器树
 * @param gameId 游戏id
 * @param mock 是否为 mock 数据
 * @returns 服务器树
 */
export async function listServerAsTreeByGameId(
  gameId: number,
  mock: boolean = false
) {
  if (mock) {
    return Promise.resolve<PromiseReturnType<GamePicker.TreeNodeVO[]>>({
      data: [
        {
          id: 1,
          parentId: 1,
          name: "欧区",
          type: "region",
          typeName: "大区",
          hot: true,
          initial: "E",
          sort: 1,
          children: [
            {
              id: 11,
              parentId: 1,
              name: "欧服",
              type: "server",
              typeName: "服务器",
              hot: true,
              initial: "E",
              sort: 1,
            },
          ],
        },
      ],
      error: null,
    });
  } else {
    const list = await $fetch<GamePicker.TreeNodeVO[]>(
      `${apiBase}/api/v1/any/shop/home/servers`,
      {
        method: "POST",
        body: {
          gameId: gameId,
        },
      }
    );
    return Promise.resolve<PromiseReturnType<GamePicker.TreeNodeVO[]>>({
      data: list,
      error: null,
    });
  }
}
