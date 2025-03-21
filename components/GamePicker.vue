<template>
  <!-- 游戏选择器组件S -->
  <div class="relative">
    <!-- 调试信息 -->
    <div v-if="debug">
      <el-card>
        <p>[state] isGameLoading: {{ isGameLoading }}</p>
        <p>[state] isServerLoading: {{ isServerLoading }}</p>
        <p>[state] gameId: {{ gameId }}</p>
        <p>[state] currentType: {{ currentType }}</p>
        <p>[state] selected: {{ selected }}</p>
        <p>[state] servers length: {{ servers.length }}</p>
        <p>[state] nodes length: {{ nodes.length }}</p>
        <p>[model] model: {{ model }}</p>
        <p>[computed] types: {{ types }}</p>
        <!-- <p>
          [computed] currentGame: {{ currentGame?.label }} -
          {{ currentGame?.value }}
        </p> -->
        <!-- <p>[computed] selected path: {{ selectedPath }}</p> -->
        <p>[computed] isCompleted: {{ isCompleted }}</p>
        <!-- <p>[computed] currentData:{{ currentData }}</p> -->
      </el-card>
    </div>
    <!-- 选择器1 -->
    <div class="flex w-full gap-x-2">
      <template v-if="steps.length">
        <div v-for="item in steps" class="w-full" :key="item.type">
          <el-input :disabled="disabled" :key="item.type" :placeholder="`请选择${item.typeName}`"
            @click="handleInputClick(item.type as NodeType)" class="game-picker-input" readonly
            :model-value="item.label">
            <template #suffix>
              <el-icon v-if="disabled" class="is-loading">
                <Loading />
              </el-icon>
              <el-icon v-else>
                <Search />
              </el-icon>
            </template>
          </el-input>
        </div>
      </template>
      <ElSkeleton v-else animated>
        <template #template>
          <ElSkeletonItem />
        </template>
      </ElSkeleton>
    </div>
    <!-- 选择器2 -->

    <!-- 内容面板分组 -->
    <div class="mt-1 absolute z-9999">
      <!-- 面板组件 -->
      <GamePanel ref="panelRef" v-if="currentType" v-loading="isGameLoading || isServerLoading" :data="currentItem"
        :type="currentType" @item-click="handleItemClick" @recently-visited-click="handleRecentlyVisitedClick"
        @close="handlePanelClose" />
    </div>
  </div>
  <!-- 游戏选择器组件E -->
</template>

<script setup lang="ts">
// ssr 时数据由调用者传入
// 非 ssr 时数据由组件内部调用
import _ from "lodash";
import { Search, Loading } from "@element-plus/icons-vue";
import { listGameAsTree, listServerAsTreeByGameId } from "./api";
import type { GamePanel } from "#components";

/**
 * 游戏选择器组件 props
 */
interface Props {
  /**
   * 是否为 mock 数据
   */

  mock?: boolean;
  /**
   * 调试模式
   */
  debug?: boolean;
  /**
   * 是否立即选中，默认 true，将选中第一个游戏及其第一个服务器。
   * 
   */
  immediateSelect?: boolean;
  /**
   * URL参数联动
   */
  urlLinkage?: boolean;
  /**
   * 游戏数据
   */
  data?: GamePicker.TreeNodeVO[];
}
/**
 * 游戏选择器路由
 */
interface PickerRoute {
  /**
   * 游戏id
   */
  game: number;
  /**
   * 地区id
   */
  region: number;
  /**
   * 服务器id
   */
  server: number;
  /**
   * 阵营id
   */
  camp: number;
}
/**
 * 解析 URL 参数
 */
interface UrlParseResult {
  /**
   * 解析后的 URL 参数
   */
  route: Partial<PickerRoute>;
  /**
   * 解析后的 URL 参数, 键值对格式
   */
  kv: KV<number, NodeType>[];
  /**
   * 有效的 URL 参数
   */
  isValid: boolean;
}
/**
 * 节点类型
 */
type NodeType = keyof PickerRoute;

const props = withDefaults(defineProps<Props>(), {
  mock: false,
  debug: false,
  immediateSelect: true,
  urlLinkage: true,
  data: () => []
});

const emit = defineEmits<{
  change: [val: KV<number>[], old?: KV<number>[], server?: string];
  itemClick: [type: string, item: any];
  select: [GamePicker.SimpleOptionVM[]]
}>();


/** =================组件状态=================== */

const model = defineModel<KV<number>[]>({ default: [] });
const gameId = defineModel<number>("gameId", { required: false });
const isGameLoading = ref(false);
const isServerLoading = ref(false);

const types = ref<NodeType[]>([]);
const games = ref<GamePicker.TreeNodeVO[]>([]);
const nodes = ref<GamePicker.TreeNodeVO[]>([]);
const servers = ref<GamePicker.TreeNodeVO[]>([]);
/**
 * 当前选中项
 */
const selected = ref<GamePicker.SimpleOptionVM[]>([]);
/**
 * 当前选中的类型
 */
const currentType = ref<Partial<NodeType>>();
/**
 * 节点类型白名单
 */
const whiteList: NodeType[] = ["game", "region", "server", "camp"];
const whiteListNames = {
  game: "游戏",
  region: "地区",
  server: "服务器",
  camp: "阵营",
};
const panelRef = useTemplateRef<InstanceType<typeof GamePanel>>("panelRef");
/** =================组件计算属性=================== */
const disabled = computed(() => {
  return isGameLoading.value || isServerLoading.value;
});
/**
 * 组件选择完成
 * isCompleted 需要判断同一个路径上的数据是否加载完毕
 */
const isCompleted = computed(() => {
  return types.value.length > 1 && types.value.length === selected.value.length;
});

const steps = computed((): GamePicker.SimpleOptionVM[] => {
  return types.value.map((m) => {
    const selectedItem = selected.value.find((c) => c.type === m);
    return {
      label: selectedItem?.label,
      value: selectedItem?.value,
      type: m,
      typeName: whiteListNames[m as keyof typeof whiteListNames],
      hot: selectedItem?.hot || false,
    };
  });
});

const preType = computed(() => {
  const currTypeIndex = types.value.findIndex((m) => m === currentType.value);
  return types.value[currTypeIndex - 1 < 0 ? 0 : currTypeIndex - 1];
});

const preStep = computed(() => {
  return selected.value.find((m) => m.type === preType.value);
});

// game region server camp
const currentItem = computed((): GamePicker.OptionVM[] => {
  let nodesWithType = nodes.value.filter((m) => m.type === currentType.value);
  if (preStep.value && preType.value !== "game") {
    nodesWithType = nodesWithType.filter(
      (m) => m.parentId == (preStep.value?.value || 0)
    );
  }
  return nodesWithType.map((m) => {
    return {
      label: m.name,
      value: m.id,
      initial: m.initial,
      hot: m.hot,
      type: m.type,
      typeName: m.typeName,
      options: [],
    };
  });
});

const selectedServer = computed(() => {
  return selected.value.filter(m => m.type !== 'game').map(m => m.label).join('/')
})


/** =================组件监听器=================== */

watch(
  () => props.data,
  async (val) => {
    if (val) {
      nodes.value = [...val];
    }
  }
);

watch(
  () => model.value,
  async (val: KV<number>[], old?: KV<number>[]) => {
    const _valList = val.map(m => ({ key: m.key, value: Number(m.value) }));
    const _oldList = old?.map(m => ({ key: m.key, value: Number(m.value) }));
    if (JSON.stringify(_valList) !== JSON.stringify(_oldList)) {
      GamePickers.log("设置默认值 watch model change 调用方法", JSON.stringify(_valList), JSON.stringify(_oldList));
      setDefaultValue(val);
      emit("change", _unReactive(val), _unReactive(old), selectedServer.value);
    }
  },
  { deep: true, immediate: false }
);

/** =================组件方法=================== */

/**
 * 选择器表单控件点击事件
 * @param type 数据项类型
 */
const handleInputClick = (type: NodeType) => {
  if (disabled.value) {
    return;
  }
  _setCurrentType(type);
  panelRef.value?.resetLetter();
};

/**
 * 处理数据节点点击事件
 * @param type 数据项类型
 * @param item 数据项
 */
const handleItemClick = async (
  type: string,
  item: GamePicker.SimpleOptionVM
) => {
  // 如果类型为游戏，则尝试加载其服务器
  if (type === "game") {
    await _changeGame(item.value!);
  }

  moveToNextType();
  selectedItem(type, item as any);

  emit("itemClick", type, item);
};

/**
 * 处理最近选择点击事件
 * @param gameId 游戏id
 */
const handleRecentlyVisitedClick = async (gameId: number) => {
  clean('server');
  currentType.value = "game";
  var gameItem = games.value.find(m => m.id === gameId) || {} as GamePicker.TreeNodeVO;
  await handleItemClick('game', {
    label: gameItem.name,
    value: gameItem.id,
    initial: gameItem.initial,
    hot: gameItem.hot,
    type: 'game',
    typeName: '游戏'
  });
}

const handlePanelClose = () => {
  closePanel();
};

/**
 * 设置默认值，从 URL 参数中获取
 */
async function setDefaultValueWithQuery() {
  // 当前 model 与 url 参数一致时，不设置默认值

  const { kv, isValid } = _parseUrlParams(window.location.href);
  if (!isValid) {
    GamePickers.log("设置默认值从 URL 参数，结束，URL 参数无效");
    return;
  }
  const _model = model.value.map(m => ({ key: m.key, value: Number(m.value) }));
  if (JSON.stringify(_model) === JSON.stringify(kv)) {
    GamePickers.log("设置默认值从 URL 参数，结束，URL 参数与 model 一致");
    return;
  }

  GamePickers.log("设置默认值从 URL 参数，开始");
  // 如果 kv 长度大于 0，且 kv 中的 key 在 whiteList 中，则设置默认值
  if (kv.length > 0 && kv.some(m => whiteList.includes(m.key as NodeType))) {
    GamePickers.log("设置默认值从 URL 参数，结束，找到可用的 URL 参数", kv);
    // 直接给 model 赋值，是否可以避免 watch  model 的触发
    GamePickers.log("设置默认值从 URL 参数，直接给 model 赋值", JSON.stringify(kv));
    model.value = kv;
  }
  else {
    GamePickers.log("设置默认值从 URL 参数，结束，没有找到可用的 URL 参数");
  }
}

/**
 * 解析 URL 参数
 * @param url url参数，eg: http://localhost:8080?game=10&region=112&server=10
 * @returns {route: Partial<PickerRoute>, kv: KV<number>[]}
 */
function _parseUrlParams(url: string): UrlParseResult {
  const params = Urls.readParams(url);
  const kv: KV<number, NodeType>[] = Array.from(params.entries()).map(([key, value]) => ({
    key: key as NodeType,
    value: Number(value),
  }));

  const route: Partial<PickerRoute> = {
    game: kv.find(m => m.key === "game")?.value,
    region: kv.find(m => m.key === "region")?.value,
    server: kv.find(m => m.key === "server")?.value,
    camp: kv.find(m => m.key === "camp")?.value,
  };

  return {
    route,
    kv,
    isValid: route.game !== undefined
  };
}

/**
 * [核心方法]
 * 设置默认值
 * cases:
 * 1. 判断当前 games 是否加载过
 * 1.1 如果未加载过，则加载游戏数据
 * 1.2 如果已加载过，则不加载游戏数据
 * 2. 传入的参数中游戏id不存在，提供服务器信息
 * 2.1 以当前游戏id为游戏id，判断当前游戏的服务器是否已经加载过
 * 2.1.1 如果未加载过，则加载服务器数据
 * 2.2 如果传入参数没有类型，则为传入的参数添加类型
 * 2.3 循环遍历传入的参数，判断节点是否存在，存在则调用 selectedItem 设置默认值，不存在且是第一个参数则退出整个方法，否则跳过本次设置默认值
 * 3. 传入的参数中游戏id存在，提供服务器信息
 * 3.1 以传入的游戏id为游戏id，查找游戏节点是否存在
 * 3.1.1 如果游戏节点不存在，则加载游戏数据
 * 3.1.1.1 加载游戏数据完毕后，查找游戏节点是否存在
 * 3.1.1.2 如果游戏节点不存在，则提示游戏不存在
 * 3.1.2 如果游戏节点存在，则判断是否需要加载服务器数据
 * 3.1.2.1 如果需要加载服务器数据，则加载服务器数据
 * 3.2 如果传入的参数没有类型，则为传入的参数添加类型
 * 3.3 循环遍历传入的参数，判断节点是否存在，存在则调用 selectedItem 设置默认值，不存在且是第一个参数则退出整个方法，否则跳过本次设置默认值
 *
 * @param params 默认值
 * eg: [{key:'game',value:10},{key:'region',value:112},{key:'server',value:10}]
 */
async function setDefaultValue(params?: KV<number>[]) {
  GamePickers.log("设置默认值 start", JSON.stringify(params));
  if (!params || params.length === 0) {
    GamePickers.log("设置默认值 params 为空，重置组件状态");
    _resetState();
    return;
  }

  // 获取游戏id
  const gameParam = params.find(m => m.key === "game");
  let _gameId = gameParam ? Number(gameParam.value) : gameId.value;

  // case 1: 传入的参数中游戏id不存在
  if (!gameParam) {
    // case 1.1: 判断当前游戏的服务器是否已经加载过
    let _serverNode = servers.value.find(s => s.parentId === _gameId);
    if (!_serverNode) {
      // case 1.1.1: 未加载过,加载服务器数据
      await loadServers(_gameId!);
    }
    // case 1.2: 为传入参数添加类型
    attemptAddType(params);
  }
  // case 2: 传入的参数中游戏id存在
  else {
    // case 2.1: 查找游戏节点是否存在
    let _gameNode = games.value.find(m => m.id === _gameId);
    if (!_gameNode) {
      // case 2.1.1: 游戏节点不存在,加载游戏数据
      loadRemoteData(_gameId);
      _gameNode = games.value.find(m => m.id === _gameId);
      if (!_gameNode) {
        // case 2.1.1.2: 游戏节点不存在,提示游戏不存在
        alert("游戏不存在");
        return;
      }
    }
    // case 2.1.2: 判断是否需要加载服务器数据
    let _serverNode = servers.value.find(s => s.parentId === _gameId);
    if (!_serverNode) {
      // case 2.1.2.1: 加载服务器数据
      await loadServers(_gameId!);
    }
    // case 2.2: 为传入参数添加类型
    attemptAddType(params);
  }

  // 先按 types 排序，再按 whiteList 过滤并排序参数
  params = params
    .filter(m => types.value.includes(m.key as NodeType))
    .filter(m => whiteList.includes(m.key as NodeType))
    .sort((a, b) => whiteList.indexOf(a.key as NodeType) - whiteList.indexOf(b.key as NodeType)) as KV<number>[];

  GamePickers.log("对 params 进行过滤和排序", params.map(m => `${m.key}:${m.value}`).join(','));


  // case 1.3 & 2.3: 循环遍历传入的参数,设置默认值
  for (const param of params) {
    const node = nodes.value.find(m => m.type === param.key && m.id === Number(param.value));
    if (!node) {
      // 如果是第一个参数且不存在,退出整个方法
      if (param === params[0]) {
        return;
      }
      // 否则跳过本次设置默认值
      continue;
    }
    // GamePickers.log("循环遍历传入的参数,设置默认值", param.key, param.value);
    selectedItem(param.key, {
      typeName: "",
      options: [],
      label: node.name,
      value: param.value,
      type: param.key,
      hot: node.hot,
      initial: node.initial,
    });
  }
  GamePickers.log("设置默认值 finish");
}

/**
 * 尝试添加类型，处理类型为 unknown 的场景（库存管理点击商品标题切换游戏选择器用到）。
 * @param params 商品定位参数
 */
function attemptAddType(params: KV<number>[]) {
  if (types.value.length === 0 || params.every(m => m.key !== "unknown")) {
    GamePickers.log("attemptAddType 忽略", JSON.stringify(params));
  }
  else {
    for (let i = 0; i < params.length; i++) {
      const element = params[i];
      if (!whiteList.includes(element.key as NodeType)) {
        element.key = types.value[i];
      }
    }
  }
}


/**
 * 将当前指针移动到下一个类型
 */
function moveToNextType() {
  const index = types.value.findIndex((m) => m == currentType.value);
  GamePickers.log(
    "moveToNextType",
    currentType.value,
    index,
    types.value.length
  );
  if (index + 1 >= types.value.length) {
    GamePickers.log("已经是最后一个类型了");
    _setCurrentType(undefined);
  } else {
    const nextType = types.value[index + 1];
    GamePickers.log("nextType", nextType);
    _setCurrentType(nextType);
  }
}

/**
 * [核心方法]
 * 选中项,查找替换
 * 找到 type 在 types 的位置将其右边的值全部重置
 * @param type 数据项类型
 * @param item 选中项
 */
function selectedItem(type: string, item: GamePicker.OptionVM) {
  const index = selected.value.findIndex((m) => m.type === type);
  if (index >= 0) {
    const delStart = index + 1;
    selected.value.splice(delStart);
  }
  const result = selected.value.find((m) => m.type === type);
  // 查找替换或添加
  if (result) {
    Object.assign(result, item);
  } else {
    selected.value.push({
      value: item.value,
      label: item.label,
      type: type,
      typeName: item.typeName,
      initial: item.initial,
      hot: item.hot,
    });
  }

  if (type === "game") {
    _changeGame(item.value!);
  }
  // 在组件选择完成所有选项时，更新 model 的值
  const _model = selected.value.map((m) => ({ key: m.type, value: m.value!, label: m.label }));
  if (types.value.length === _model.length) {
    model.value = _model;
  }
  // 如果 urlLinkage 为 true，则动态设置 url 参数
  if (props.urlLinkage) {
    // 清理 url 参数
    types.value.forEach(m => Urls.removeParam(m));
    // 动态设置 url 参数
    selected.value.forEach(m => Urls.addParam(m.type, String(m.value)));
  }
  // 触发选择事件
  emit("select", selected.value);
}


/**
 * 清理数据
 * @param type 'game' | 'server'
 */
function clean(type: "game" | "server") {
  if (type == "game") {
    GamePickers.log("clean game");
    games.value.length = 0;
  }
  if (type == "server") {
    GamePickers.log("clean server");
    servers.value.length = 0;
  }
}

/**
 * 关闭面板
 */
function closePanel() {
  _setCurrentType(undefined);
}

/**
 * 设置当前选项类型
 * @param type 选项类型
 */
function _setCurrentType(type: NodeType | undefined) {
  currentType.value = type;
}


/**
 * 重置状态
 */
function _resetState() {
  selected.value = [];
  gameId.value = undefined;
  Urls.removeParam("game");
  Urls.removeParam("region");
  Urls.removeParam("server");
}

const _changeGame = async (id: number) => {
  // 如果 id 为字符串，则转换为数字
  id = Number(id);
  gameId.value = id;
  // 判断是否已加载过
  if (servers.value.find(m => m.parentId === id)) {
    return;
  }
  await loadServers(id);
}

/** =================辅助函数=================== */

/**
 * 加载游戏数据
 * @param loadSuccess 数据加载完毕的回调函数
 */
async function loadGames(loadSuccess?: GamePicker.LoadSuccessFn) {
  GamePickers.log("loadGames start");
  isGameLoading.value = true;
  const { data, error } = await listGameAsTree(props.mock);
  if (error) {
    console.error("loadGames", error);
    alert("加载游戏数据失败");
    return;
  }
  if (data) {
    const formated = _formatDate(data, "game");
    games.value = [...formated];
    nodes.value = [...formated];
    // 设置游戏id
    gameId.value = formated[0].id;
    if (loadSuccess) {
      loadSuccess(formated);
    }
  }
  isGameLoading.value = false;
  GamePickers.log("loadGames finish");
}

/**
 * 加载服务器数据（树）
 * @param gameId 游戏id
 * @param loadSuccess 数据加载完毕的回调函数
 */
async function loadServers(
  gameId: number,
  loadSuccess?: GamePicker.LoadSuccessFn<GamePicker.TreeNodeVO, KV<number, NodeType>[]>
) {
  GamePickers.log("loadServers start", gameId);
  isServerLoading.value = true;
  const { data, error } = await listServerAsTreeByGameId(gameId, props.mock);
  if (error || !data) {
    alert("加载游戏服务器数据失败");
    return;
  }
  // 获取第一个节点及其所有的子孙节点数据
  const serverIndexs: KV<number, NodeType>[] = [];
  // TODO: 需要保证节点数组的顺序
  const descendants = getFirstDescendantNodes([data[0]]);
  descendants.map(m => {
    serverIndexs.push({
      key: m.type as NodeType,
      value: m.id,
      label: m.name,
    });
  });

  const list = Trees.flatten(data as any) as GamePicker.TreeNodeVO[];
  types.value = ["game", ..._extractUniqueTypes(list as any)];
  const formated = _formatDate(list, "server");
  nodes.value = [..._unReactive(games.value), ...formated];
  servers.value = [...formated];
  if (loadSuccess) {
    loadSuccess(formated, serverIndexs);
  }
  isServerLoading.value = false;
  GamePickers.log("loadServers finish");
}



/**
 * 格式化数据
 * @param nodes 节点数据
 */
function _formatDate(nodes: GamePicker.TreeNodeVO[], type: NodeType): GamePicker.TreeNodeVO[] {
  const formated = nodes.map((n) => {
    return {
      id: n.id!,
      parentId: n.parentId!,
      name: n.name!,
      type: n.type!,
      typeName: n.typeName!,
      hot: n.hot!,
      initial: n.initial || "",
      sort: n.sort!,
      children: n.children as GamePicker.TreeNodeVO[],
    };
  });
  if (type == 'game') {
    return _.sortBy(formated, "sort");
  } else {
    return _.sortBy(formated, "name");
  }
}

/**
 * 提取唯一类型数组
 * @param data 节点数据
 * @returns 唯一类型数组, eg: ['game', 'region', 'server']
 */
function _extractUniqueTypes(data: GamePicker.TreeNodeVO[]): NodeType[] {
  return [...new Set(data.map((item) => item.type as NodeType))];
}

/**
 * 将值转换为非响应式
 * @param val 值，undefined 或 null 返回原值
 * @returns 非响应式值
 */
function _unReactive(val: any) {
  if (val === undefined || val === null) {
    GamePickers.log("_unReactive val is empty");
    return val;
  }
  return JSON.parse(JSON.stringify(val));
}

/**
 * 是否首次加载
 */
const firstLoaded = ref(true);

/**
 * 加载远程数据
 * @param game 游戏id
 * @param isValid 是否有效的 URL 参数
 */
async function loadRemoteData(game?: number, isValid?: boolean) {
  if (isGameLoading.value || isServerLoading.value) {
    return;
  }
  await loadGames();
  const firstGame = games.value[0];
  await loadServers(game || firstGame.id, (_data, _indexs) => {
    // 首次加载时如果 immediateSelect 为 true，并且 URL 参数无效，则设置默认值
    if (props.immediateSelect && firstLoaded.value && !isValid) {
      GamePickers.log("首次加载并且设置了 immediateSelect 为 true", _indexs);
      firstLoaded.value = false;
      // 直接给 model 赋值，是否可以避免 watch model 的触发
      model.value = [{ key: "game", value: firstGame.id, label: firstGame.name }, ...(_indexs || [])];
    }
    else {
      GamePickers.log("设置默认值 不满足条件 期望 immediateSelect 为 true 且 firstLoaded 为 true 且 isValid 为 false 实际 immediateSelect:", props.immediateSelect, "firstLoaded:", firstLoaded.value, "isValid:", isValid);
    }
  });
}

onMounted(async () => {
  GamePickers.log("onMounted");

  // 1.尝试解析 URL 参数，如果有 game 参数，则加载服务器数据时，使用 game 参数，否则直接加载远程数据
  const { route, isValid } = _parseUrlParams(window.location.href);
  if (props.data.length === 0) {
    await loadRemoteData(route.game, isValid);
  }
  await setDefaultValueWithQuery();
});

/** =================暴露的方法=================== */

defineExpose({
  setDefaultValue,
});

/**
 * 获取指定节点的所有子孙节点中第一个子节点
 * @param nodes 节点数据
 * @returns 所有子孙节点中第一个子节点
 */
function getFirstDescendantNodes(nodes: GamePicker.TreeNodeVO[]): GamePicker.TreeNodeVO[] {
  const resultNodes: GamePicker.TreeNodeVO[] = [];

  function traverse(node: GamePicker.TreeNodeVO) {
    resultNodes.push(node); // 添加当前节点
    if (node.children && node.children.length > 0) {
      traverse(node.children[0]); // 递归遍历第一个子节点
    }
  }

  nodes.forEach(node => traverse(node));
  return resultNodes;
}
</script>

<style lang="scss" scoped>
.game-picker-input {
  :deep(.el-input__inner) {
    cursor: pointer;
    caret-color: transparent;
  }
}
</style>
