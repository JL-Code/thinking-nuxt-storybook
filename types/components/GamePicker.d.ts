export = GamePicker;
export as namespace GamePicker;

/**
 * 游戏选择器命名空间
 */
declare namespace GamePicker {
  /**
   * 后端返回的树形结构
   */
  interface TreeNodeVO {
    /**
     * 节点id
     */
    id: number;
    /**
     * 父节点id
     */
    parentId: number;
    /**
     * 节点名
     */
    name: string;
    /**
     * 节点类型
     */
    type: string;
    /**
     * 节点类型名称
     */
    typeName: string;
    /**
     * 是否热门
     */
    hot: boolean;
    /**
     * 首字母
     */
    initial: string;
    /**
     * 排序
     */
    sort: number;
    /**
     * 子级
     */
    children?: TreeNodeVO[];
  }

  /**
   * 选择器组件选项视图模型
   */
  type OptionVM = {
    /**
     * 选项标签
     */
    label?: string;
    /**
     * 选项值
     */
    value?: number;
    /**
     * 游戏项类型
     */
    type: string;
    /**
     * 游戏项名称
     */
    typeName: string;
    /**
     * 筛选热门
     */
    hot: boolean;
    /**
     * 筛选字母
     */
    initial?: string;
    /**
     * 游戏项的数据选项
     */
    options: SimpleOptionVM[];
  };

  /**
   * 选中项类型
   */
  type SimpleOptionVM = Pick<
    OptionVM,
    "label" | "value" | "type" | "hot" | "initial" | 'typeName'
  > & { sort?: number };

  /**
   * 加载成功回调函数类型
   */
  type LoadSuccessFn = (data: any[]) => void;
}
