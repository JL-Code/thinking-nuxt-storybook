<template>
  <!-- 游戏选择器组件S -->
  <div class="relative">
    <div v-if="debug">
      <el-card>
        <p>[state] isGameLoading: {{ isGameLoading }}</p>
        <p>[state] gameId: {{ gameId }}</p>
        <p>[state] currentType: {{ currentType }}</p>
        <p>[state] selected: {{ selected }}</p>
        <p>[state] games: {{ games }}</p>
        <p>[state] servers: {{ servers }}</p>
        <p>[state] nodes: {{ nodes }}</p>
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
    <!-- 输入框区 -->
    <div class="flex gap-x-2">
      <div v-for="item in steps" :key="item.type">
        <el-input
          :readonly="isGameLoading"
          :model-value="item.label"
          :placeholder="`请选择${item.typeName}`"
          :suffix-icon="ArrowDown"
          @click="handleInputClick(item.type)"
        />
      </div>
    </div>
    <!-- 内容面板分组 -->
    <div class="game-panel-group drop-shadow mt-1 absolute z-9999">
      <!-- 面板组件 -->
      <GamePanel
        v-if="currentType"
        v-loading="isGameLoading"
        :data="currentItem"
        :type="currentType"
        @item-click="handleItemClick"
        @close="handlePanelClose"
      />
    </div>
  </div>
  <!-- 游戏选择器组件E -->
</template>
<script setup lang="ts">
// ssr 时数据由调用者传入
// 非 ssr 时数据由组件内部调用
import _ from "lodash";
import { ArrowDown } from "@element-plus/icons-vue";
import { listGameAsTree, listServerAsTreeByGameId } from "./api";
interface Props {
  /**
   * 调试模型，默认 false
   */
  debug?: boolean;
  /**
   * url 参数联动，默认 false
   */
  urlLinkage?: boolean;
  /**
   * 游戏数据
   */
  data?: GamePicker.TreeNodeVO[];
}
const props = withDefaults(defineProps<Props>(), {
  debug: false,
  urlLinkage: false,
  data: () => [],
});
const emit = defineEmits<{
  change: [val: KV<number>[], old?: KV<number>[]];
  itemClick: [type: string, item: any];
}>();

// TODO: ssr 开启时，主要主动应用 apiBase，openapi.client.ts 还未初始化好
const config = useRuntimeConfig();
const apiBase = config.public.apiBase;
/** =================组件状态=================== */

const model = defineModel<KV<number>[]>({ default: [] });
const gameId = defineModel<number>("gameId");

const isGameLoading = ref(false);
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
const whiteList = ["game", "region", "server"];
const whiteListNames = {
  game:"游戏",
  region:"地区",
  server:"服务器"
}
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

/** =================组件监听器=================== */

watch(
  () => props.data,
  async (val) => {
    console.log("[game picker] watch data value", val);
    if (val) {
      nodes.value = [...val];
      games.value = [...val];
    }
  },
  { immediate: true, deep:true }
);

watch(
  () => gameId.value,
  async (val: number | undefined) => {
    console.log("[game picker] watch gameId value", val);
    if (val) {
      await loadServer(val);
    } else {
      clean("server");
    }
  },
  { immediate: true }
);

watch(
  () => model.value,
  async (val: KV<number>[], old?: KV<number>[]) => {
    console.log("[game picker] watch model value", val, old);
    if (JSON.stringify(val) !== JSON.stringify(old)) {
      setDefaultValue(val);
      emit("change", val, old);
    }
  }
);

/** =================暴露的方法=================== */

defineExpose({
  setDefaultGame,
  setDefaultValue,
});

/** =================组件方法=================== */

/**
 * 选择器表单控件点击事件
 * @param type 数据项类型
 */
const handleInputClick = (type: string) => {
  console.log("[game-picker] 选中", type);
  setCurrentType(type);
};

/**
 * 数据项点击事件
 * @param type 数据项类型
 * @param item 数据项
 */
const handleItemClick = async (
  type: string,
  item: GamePicker.SimpleOptionVM
) => {
  if (props.urlLinkage) {
    // 动态设置 url 参数
    Urls.addParam(type, String(item.value));
  }
  console.log("[game-picker] handleItemClick", type, item);
  if (type === "game") {
    gameId.value = item.value;
    // 重新加载服务器数据
    await loadServer(item.value!);
  }

  moveToNextType();
  selectedItem(type, item as any);

  emit("itemClick", type, item);
};

const handlePanelClose = () => {
  closePanel();
};

/**
 * 从 URL 参数中设置默认值
 */
function setDefaultValueWithQuery() {
  const params = Urls.readParams(window.location.href);
  const obj = Object.fromEntries(params.entries());
  console.log("obj", obj);

  const kv: KV<number>[] = Array.from(params.entries()).map(([key, value]) => ({
    key,
    value,
  })) as any;

  console.log("kv", kv);

  setDefaultValue(kv);
}

/**
 * [核心方法]
 * 设置默认值
 *
 * @param params 默认值
 * eg: [{key:'game',value:10},{key:'region',value:112},{key:'server',value:10}]
 */
async function setDefaultValue(params?: KV<number>[]) {
  if (!params) {
    return;
  }
  let _gameId = params.find((m) => m.key === "game")?.value;
  for (const param of params) {
    const node: GamePicker.TreeNodeVO | undefined = nodes.value.find(
      (m) => m.type == param.key && m.id == param.value
    );
    // 设置默认值时后续数据可能还未加载或已加载数据发生了改变匹配不上，这时需要主动或重新加载数据。
    if (!node) {
      // 重新加载数据
      switch (param.key) {
        case "game":
          _gameId = param.value;
          console.debug(
            `[game] 节点类型[${param.key}]的数据不存在，开始重新加载数据`
          );
          await loadData();
          break;
        default:
          console.debug(
            `[game] 节点类型[${param.key}]的数据不存在，开始重新加载数据`
          );
          if (!_gameId) {
            console.warn("[game picker] 游戏id无效，跳过设置默认值");
            break;
          }
          await loadServer(_gameId);
          console.log("[game] 服务器加载完毕", _gameId, Date.now());
          break;
      }
    }
    attemptAddType(params);
    const _node: GamePicker.TreeNodeVO | undefined = nodes.value.find(
      (m) => m.type == param.key && m.id == param.value
    );
    if (_node) {
      console.log(`[game picker] 设置默认值 type: ${param.key}`, param.value);
      selectedItem(param.key, {
        typeName: "",
        options: [],
        label: _node.name,
        value: param.value,
        type: param.key,
        hot: _node.hot,
        initial: _node.initial,
      });
    }
  }
}

/**
 * 尝试添加类型，处理类型为 unknown 的场景（库存管理点击商品标题切换游戏选择器用到）。
 * @param params 商品定位参数
 */
function attemptAddType(params: KV<number>[]) {
  if(types.value.length===0){
    return
  }
  for (let i = 0; i < params.length; i++) {
    const element = params[i];
    if(!whiteList.includes(element.key)){
      element.key = types.value[i];
    }
  }
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
    await loadData();
  }
  params.push({ key: "game", value: gameId });
  // 加载服务器信息
  await loadServer(gameId);
  for (const type of types.value) {
    const node = servers.value.filter((m) => m.type === type)[0];
    if (node) {
      params.push({ key: type, value: node.id });
    }
  }
  console.log("[game] setDefaultGame", params);
  await setDefaultValue(params);
}

/**
 * 清理数据
 * @param type 'game' | 'server'
 */
function clean(type: "game" | "server") {
  if (type == "game") {
    console.debug("[game] clean game");
    games.value.length = 0;
  }
  if (type == "server") {
    console.debug("[game] clean server");
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
 * 将当前指针移动到下一个类型
 */
function moveToNextType() {
  const index = types.value.findIndex((m) => m == currentType.value);
  console.debug(
    "[game] moveToNextType",
    currentType.value,
    index,
    types.value.length
  );
  if (index + 1 >= types.value.length) {
    console.debug("[game] 已经是最后一个类型了");
    setCurrentType("");
  } else {
    const nextType = types.value[index + 1];
    console.debug("[game] nextType", nextType);
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
    gameId.value = item.value;
  }
  //
  model.value = selected.value.map((m) => ({ key: m.type, value: m.value! }));
}

/** =================辅助函数=================== */
async function loadData(loadSuccess?: GamePicker.LoadSuccessFn) {
  const { data, error } = await listGameAsTree();
  if (error) {
    console.error("[game picker] loadData", error);
  }
  if (data) {
    const formated = formatDate(data);
    games.value = [...formated];
    nodes.value = [...formated];
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
async function loadServer(
  gameId: number,
  loadSuccess?: GamePicker.LoadSuccessFn
) {
  isGameLoading.value = true;
  const { data, error } = await listServerAsTreeByGameId(gameId);
  isGameLoading.value = false;
  if (error) {
    console.error("[game picker] loadServer", error);
  }
  const list = Trees.flatten(data as any) as GamePicker.TreeNodeVO[];
  types.value = ["game", ...extractUniqueTypes(list as any)];
  const formated = formatDate(list);
  nodes.value = [...games.value, ...formated];
  servers.value = [...formated];
  if (loadSuccess) {
    loadSuccess(formated);
  }
}

/**
 * 格式化数据
 * @param nodes 节点数据
 */
function formatDate(nodes: GamePicker.TreeNodeVO[]): GamePicker.TreeNodeVO[] {
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
  return _.sortBy(formated, "sort");
}

function extractUniqueTypes(data: GamePicker.TreeNodeVO[]): string[] {
  return [...new Set(data.map((item) => item.type))];
}

onMounted(async () => {
  if (props.data.length === 0) {
    await loadRemoteData();
  }
});

async function loadRemoteData() {
  await loadData(async (data) => {
    const game = data[0];
    await loadServer(game.id);
  });
}
</script>
