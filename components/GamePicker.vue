<template>
  <!-- 游戏选择器组件S -->
  <div class="relative">
    <!-- 调试信息 -->
    <div v-if="debug">
      <el-card>
        <p>[state] isGameLoading: {{ isGameLoading }}</p>
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
        <div v-for="item in steps" class="w-full">
          <el-input :key="item.type" :placeholder="`请选择${item.typeName}`" @click="handleInputClick(item.type)"
            class="game-picker-input" readonly :model-value="item.label" :suffix-icon="Search" />
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
      <GamePanel v-if="currentType" v-loading="isGameLoading || isServerLoading" :data="currentItem" :type="currentType"
        @item-click="handleItemClick" @recently-visited-click="handleRecentlyVisitedClick" @close="handlePanelClose" />
    </div>
  </div>
  <!-- 游戏选择器组件E -->
</template>
<script setup lang="ts">
// ssr 时数据由调用者传入
// 非 ssr 时数据由组件内部调用
import _ from "lodash";
import { Search } from "@element-plus/icons-vue";
import { listGameAsTree, listServerAsTreeByGameId } from "./api";
interface Props {
  /**
   * 调试模式
   */
  debug?: boolean;
  /**
   * URL参数联动
   */
  urlLinkage?: boolean;
  /**
   * 默认游戏
   */
  defaultGame?: number;
  /**
   * 游戏数据
   */
  data?: GamePicker.TreeNodeVO[];
}
type NodeType = "game" | "region" | "server" | "camp";
const props = withDefaults(defineProps<Props>(), {
  debug: false,
  urlLinkage: true,
  data: () => [],
  defaultGame: undefined,
});
const emit = defineEmits<{
  change: [val: KV<number>[], old?: KV<number>[], server?: string];
  itemClick: [type: string, item: any];
  select: [GamePicker.SimpleOptionVM[]]
}>();


/** =================组件状态=================== */

const model = defineModel<KV<number>[]>({ default: [] });
const gameId = defineModel<number>("gameId");
const isGameLoading = ref(false);
const isServerLoading = ref(false);
const disabled = computed(() => {
  return isGameLoading.value || isServerLoading.value;
});
const types = ref<string[]>([]);
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
const currentType = ref<string>("");
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
/** =================组件计算属性=================== */

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
  () => props.defaultGame,
  async (val) => {
    if (val) {
      await setDefaultGame(val);
    }
  },
  { immediate: true }
);

// watch(
//   () => gameId.value,
//   async (val: number | undefined, old?: number) => {
//     if (val !== old) {
//       _changeGame(val || 0);
//     }
//   }
// );

watch(
  () => model.value,
  async (val: KV<number>[], old?: KV<number>[]) => {
    const _valList = val.map(m => ({ value: Number(m.value) }));
    const _oldList = old?.map(m => ({ value: Number(m.value) }));
    if (JSON.stringify(_valList) !== JSON.stringify(_oldList)) {
      _log("model change", _valList, _oldList);
      setDefaultValue(val);
      emit("change", _unReactive(val), _unReactive(old), selectedServer.value);
    }
  },
  { deep: true, immediate: true }
);

/** =================组件方法=================== */

/**
 * 选择器表单控件点击事件
 * @param type 数据项类型
 */
const handleInputClick = (type: string) => {
  if (disabled.value) {
    return;
  }
  console.debug("[game-picker] 选中", type);
  setCurrentType(type);
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
 * 从 URL 参数中设置默认值
 */
function setDefaultValueWithQuery() {
  console.debug("setDefaultValueWithQuery");
  const params = Urls.readParams(window.location.href);
  const kv: KV<number>[] = Array.from(params.entries()).map(([key, value]) => ({
    key,
    value,
  })) as any;
  // 如果 kv 长度大于 0，且 kv 中的 key 在 whiteList 中，则设置默认值
  if (kv.length > 0 && kv.some(m => whiteList.includes(m.key as NodeType))) {
    _log("setDefaultValueWithQuery kv", kv);
    setDefaultValue(kv);
  }
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
  _log("setDefaultValue start", JSON.stringify(params));
  if (!params || params.length === 0) {
    _log("setDefaultValue params is empty");
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
      await loadRemoteData(_gameId);
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
    .filter(m => types.value.includes(m.key))
    .filter(m => whiteList.includes(m.key as NodeType))
    .sort((a, b) => whiteList.indexOf(a.key as NodeType) - whiteList.indexOf(b.key as NodeType)) as KV<number>[];

  _log("对 params 进行过滤和排序", params.map(m => `${m.key}:${m.value}`).join(','));


  // case 1.3 & 2.3: 循环遍历传入的参数,设置默认值
  for (const param of params) {
    _log("循环遍历传入的参数", param);
    const node = nodes.value.find(m => m.type === param.key && m.id === Number(param.value));
    if (!node) {
      // 如果是第一个参数且不存在,退出整个方法
      if (param === params[0]) {
        return;
      }
      // 否则跳过本次设置默认值
      continue;
    }
    _log("循环遍历传入的参数,设置默认值", param.key, param.value);
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
  _log("setDefaultValue finish");
}

/**
 * 尝试添加类型，处理类型为 unknown 的场景（库存管理点击商品标题切换游戏选择器用到）。
 * @param params 商品定位参数
 */
function attemptAddType(params: KV<number>[]) {
  if (types.value.length === 0 || params.every(m => m.key !== "unknown")) {
    _log("attemptAddType 忽略", JSON.stringify(params));
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
  console.info(
    "[game-picker] moveToNextType",
    currentType.value,
    index,
    types.value.length
  );
  if (index + 1 >= types.value.length) {
    console.info("[game-picker] 已经是最后一个类型了");
    setCurrentType("");
  } else {
    const nextType = types.value[index + 1];
    console.info("[game-picker] nextType", nextType);
    setCurrentType(nextType);
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
  console.debug("[game] selected item", type, item);
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
 * [核心方法]
 * 设置默认游戏
 * @param gameId 游戏id
 */
async function setDefaultGame(gameId: number) {
  if (!gameId) {
    return;
  }
  const params: KV<number>[] = [];
  const gameNode = games.value.find((m) => m.id == gameId);
  if (!gameNode) {
    await loadGames();
  }
  params.push({ key: "game", value: gameId });
  await loadServers(gameId);
  for (const type of types.value) {
    const node = servers.value.filter((m) => m.type === type)[0];
    if (node) {
      params.push({ key: type, value: node.id });
    }
  }
  console.debug("[game] setDefaultGame", params);
  await setDefaultValue(params);
}

/**
 * 清理数据
 * @param type 'game' | 'server'
 */
function clean(type: "game" | "server") {
  if (type == "game") {
    console.info("[game-picker] clean game");
    games.value.length = 0;
  }
  if (type == "server") {
    console.info("[game-picker] clean server");
    servers.value.length = 0;
  }
}

/**
 * 设置当前选项类型
 * @param type 选项类型
 */
function setCurrentType(type: string) {
  console.debug("[game] type change", type);
  currentType.value = type;
}

/**
 * 关闭面板
 */
function closePanel() {
  setCurrentType("");
}

/**
 * 重置状态
 */
function _resetState() {
  selected.value = [];
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
  isGameLoading.value = true;
  const { data, error } = await listGameAsTree();
  isGameLoading.value = false;
  if (error) {
    console.error("loadGames", error);
  }
  _log("loadGames finish");
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
}

/**
 * 加载服务器数据（树）
 * @param gameId 游戏id
 * @param loadSuccess 数据加载完毕的回调函数
 */
async function loadServers(
  gameId: number,
  loadSuccess?: GamePicker.LoadSuccessFn
) {
  isServerLoading.value = true;
  const { data, error } = await listServerAsTreeByGameId(gameId);
  isServerLoading.value = false;
  if (error) {
    console.error("loadServers", error);
  }
  _log("loadServers finish");
  const list = Trees.flatten(data as any) as GamePicker.TreeNodeVO[];
  types.value = ["game", ..._extractUniqueTypes(list as any)];
  const formated = _formatDate(list, "server");
  nodes.value = [..._unReactive(games.value), ...formated];
  servers.value = [...formated];
  if (loadSuccess) {
    loadSuccess(formated);
  }
}


/**
 * 格式化数据
 * @param nodes 节点数据
 */
function _formatDate(nodes: GamePicker.TreeNodeVO[], type: string): GamePicker.TreeNodeVO[] {
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

function _extractUniqueTypes(data: GamePicker.TreeNodeVO[]): string[] {
  return [...new Set(data.map((item) => item.type))];
}

function _unReactive(val: any) {
  if (val === undefined || val === null) {
    _log("_unReactive val is empty");
    return val;
  }
  return JSON.parse(JSON.stringify(val));
}

/**
 * 打印日志
 * @param args 日志内容
 */
function _log(...args: any[]) {
  console.info(...['%c[game picker]', 'color: green;', ...args]);
}

/**
 * 加载远程数据
 * @param gameId 游戏id
 */
async function loadRemoteData(gameId?: number) {
  await loadGames(async (data) => {
    const game = data[0];
    await loadServers(gameId || game.id);
  });
}

onMounted(async () => {
  if (props.data.length === 0) {
    await loadRemoteData();
  }
  setDefaultValueWithQuery();
});

/** =================暴露的方法=================== */

defineExpose({
  setDefaultGame,
  setDefaultValue,
});
</script>

<style lang="scss" scoped>
.game-picker-input {
  :deep(.el-input__inner) {
    cursor: pointer;
    caret-color: transparent;
  }
}
</style>