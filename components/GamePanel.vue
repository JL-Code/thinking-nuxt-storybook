<template>
  <!-- 内容面板 -->
  <ElCard shadow="never" class="min-w-4xl">
    <template #header>
      <div class="flex items-center gap-x-2">
        <el-text type="info" size="small">最近选择：</el-text>
        <div class="flex gap-x-2">
          <div v-for="item in recentlyVisited" :key="item.value" @click="handleRecentlyVisitedClick(item.value!)"
            class="cursor-pointer line-clamp-1 hover:underline text-xs">
            {{ item.label }}
          </div>
        </div>
      </div>
      <!-- 关键字搜索 -->
      <div class="flex justify-between items-center pt-3 gap-x-2">
        <div class="flex items-center gap-x-2">
          <div>
            <el-input :size="size" v-model="keyword" :suffix-icon="Search" placeholder="请输入关键字" />
          </div>
          <div>
            <ElLink type="primary" href="tencent://message/?uin=3007797691&Site=比价器BiJiaQi.com&Menu=yes">
              没有您要的游戏？
            </ElLink>
          </div>
        </div>
        <div>
          <el-button :size="size" type="danger" @click="$emit('close')">关闭
          </el-button>
        </div>
      </div>
      <!-- 字母快速导航条 -->
      <div class="flex mt-2">
        <GameLetterIndex :size="size" v-model="letter" :letters="mixedLetters" />
      </div>
    </template>
    <!-- 内容区 -->
    <el-scrollbar max-height="400">
      <div v-if="filteredData.length" class="flex flex-wrap gap-2 w-full">
        <div v-for="item in filteredData" :key="item.value" :title="item.label"
          class="w-40 cursor-pointer line-clamp-1 hover:underline text-xs" @click="handleItemClick(item)">
          {{ item.label }}
        </div>
      </div>
      <el-empty v-else class="mx-auto" :image-size="100" />
    </el-scrollbar>
  </ElCard>
</template>
<script lang="ts" setup>
import { Search } from "@element-plus/icons-vue";
import Fuse from 'fuse.js';
import { watchDebounced } from '@vueuse/core'

interface Props {
  /**
   * 数据
   */
  data: GamePicker.SimpleOptionVM[];
  /**
   * 类型
   */
  type: string;
  /**
   * 大小
   */
  size?: "small" | "default" | "large" | "";
  /**
   * 额外属性
   */
  props?: { label: string; value: string };
}
type FuseItem = { item: GamePicker.SimpleOptionVM, refIndex: number }

const rootProps = withDefaults(defineProps<Props>(), {
  data: () => [],
  size: "default",
  props: () => {
    return { label: "label", value: "value" };
  },
});
const emit = defineEmits<{
  close: [];
  itemClick: [type: string, item: GamePicker.SimpleOptionVM];
  recentlyVisitedClick: [gameId: number];
}>();

const ALL = "全部"
const HOT = "热门"
const letter = ref<string>(ALL);
const keyword = ref<string>("");
const dataWithKeyword = ref<FuseItem[]>([])
const fuse = ref()

const letters = computed((): string[] => {
  const initials = rootProps.data.filter(m => m.initial).map((m) => m.initial!);
  return [...new Set(initials.sort())]
})

watchDebounced(() => keyword.value, (val: string) => {
  console.log("[game-panel] keyword.value", val)
  dataWithKeyword.value = fuse.value.search(val) as FuseItem[];
}, { debounce: 500, maxWait: 1000 })
watch(() => rootProps.data, (val) => {
  console.log("[game-panel] panel watch")
  fuse.value = new Fuse(val, {
    keys: ['label', 'initial']
  });
}, {
  immediate: true
})

/**
 * 混合字母
 */
const mixedLetters = computed(() => {
  return [HOT, ALL, ...letters.value]
})

/**
 * 过滤后的数据
 */
const filteredData = computed(() => {
  let _arr: GamePicker.SimpleOptionVM[] = []
  if (letter.value === ALL) {
    _arr = rootProps.data;
  } else if (letter.value === HOT) {
    _arr = rootProps.data.filter((item: GamePicker.SimpleOptionVM) => item.hot)
  } else {
    _arr = rootProps.data.filter((item: GamePicker.SimpleOptionVM) => item.initial === letter.value);
  }
  // keyword 过滤
  const keywordValues = dataWithKeyword.value.map(m => m.item.value);
  if (keyword.value) {
    _arr = _arr.filter(m => keywordValues.includes(m.value))
  }
  return _arr;
})

const cleanKeyword = () => {
  _log("cleanKeyword", keyword.value)
  keyword.value = ""
}
const resetLetter = () => {
  _log("resetLetter", letter.value)
  letter.value = ALL
}

const handleItemClick = (item: GamePicker.SimpleOptionVM) => {
  _log("handleItemClick", item)
  cleanKeyword();
  resetLetter();
  if (rootProps.type === "game") {
    saveRecentlyVisited(item)
  }
  emit("itemClick", rootProps.type, item);
};



/**
 * 最近访问机制
 */

const handleRecentlyVisitedClick = (gameId: number) => {
  _log("handleRecentlyVisitedClick", gameId)
  cleanKeyword();
  resetLetter();
  emit('recentlyVisitedClick', gameId)
}

const recentlyVisited = ref<GamePicker.SimpleOptionVM[]>([])

const getRecentlyVisited = () => {
  const _cache = localStorage.getItem('recentlyVisited')
  recentlyVisited.value = _cache ? JSON.parse(_cache) : []
}

const saveRecentlyVisited = (item: GamePicker.SimpleOptionVM) => {
  if (recentlyVisited.value.some(m => m.value === item.value)) {
    return;
  }
  recentlyVisited.value.push(item)
  localStorage.setItem('recentlyVisited', JSON.stringify(recentlyVisited.value))
}

/**
 * 打印日志
 * @param args 日志内容
 */
function _log(...args: any[]) {
  console.info(...['%c[game panel]', 'color: green;', ...args]);
}

onMounted(() => {
  getRecentlyVisited()
})
</script>
