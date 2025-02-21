type Consumer = (node: Node | AnyObj) => boolean;

interface Node {
  id: string;
  name: string;
  children: Node[] | null;
}

interface TreeNode {
  id: number;
  name: string;
  children?: TreeNode[] | null;
}

/**
 * 查找树指定节点
 * @param {String} nodeId 节点 ID
 * @param {Array|Object} nodes 树节点集合（拥有属性：children ）
 */
function findById(id: string, nodes: any): any {
  for (const node of nodes) {
    // console.debug("find", node.id, node.name, node);
    if (node.id === id) {
      // console.debug("find success", node.id, node.name, node);
      return node;
    }
    if (Array.isArray(node.children)) {
      const result = findById(id, node.children);
      if (result) {
        return result;
      }
    }
  }
}

/**
 *
 * @param findFn
 * @param nodes
 * @returns
 */
function find(findFn: Consumer, nodes: Node[]): any {
  for (const node of nodes) {
    // console.debug("find", node.id, node.name, node);

    if (findFn(node)) {
      // console.debug("find success", node.id, node.name, node);
      return node;
    }
    if (Array.isArray(node.children)) {
      const result = find(findFn, node.children);
      if (result) {
        return result;
      }
    }
  }
}

/**
 * 递归遍历树节点
 * @param pnode 父级节点
 * @param {Array|Object} subtree 采用“孩子表示法”（包含 children 属性）的一棵树
 * {
 *    id:1,
 *    children: [
 *        {id:1}
 *    ]
 * }
 * @param {Function} callback 节点遍历回调函数，接收两个参数 param1 子节点 param2 父节点
 */
function recursiveLook(
  pnode: any,
  subtree: any,
  callback?: (node: any, pnode: any) => void
) {
  for (const node of subtree) {
    if (callback) callback(node, pnode);
    if (Array.isArray(node.children)) {
      recursiveLook(node, node.children, callback);
    }
  }
}

/**
 * 树结构转为一维数组
 * @param {Array<TreeNode>} nodes 树节点数组
 * @param cleanChildren 清理节点的子集
 * @returns 一维结构的节点数组
 */
function flatten(nodes: TreeNode[], cleanChildren = true): TreeNode[] {
  const result: TreeNode[] = [];
  // 初始化栈
  const stack: TreeNode[] = [...nodes];

  while (stack.length > 0) {
    // 弹出栈顶元素
    const node = stack.pop() as TreeNode;
    result.push(node);

    if (Array.isArray(node.children)) {
      // 将子节点入栈
      stack.push(...node.children);
      if (cleanChildren) {
        // 移除 children 引用
        node.children = null;
      }
    }
  }

  return result;
}

export default {
  findById,
  find,
  flatten,
  recursiveLook
};
