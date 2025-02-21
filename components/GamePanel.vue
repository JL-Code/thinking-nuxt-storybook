<template>
  <!-- 内容面板 -->
  <el-card shadow="never" class="min-w-4xl">
    <template #header>
      <div class="flex items-center gap-x-2">
        <el-text type="info">最近选择：</el-text>
        <div class="flex gap-x-2">
          <p
            @click="handleRecentlyVisitedClick(331)"
            class="cursor-pointer line-clamp-1 hover:underline text-sm"
          >
            魔兽世界美服
          </p>
        </div>
      </div>
      <!-- 关键字搜索 -->
      <div class="flex justify-between items-center pt-3 gap-x-2">
        <div class="flex items-center gap-x-2">
          <div>
            <el-input
              v-model="keyword"
              :suffix-icon="Search"
              placeholder="请输入关键字"
            />
          </div>
          <div>
            <el-link
              type="primary"
              href="tencent://message/?uin=3007797691&Site=比价器BiJiaQi.com&Menu=yes"
            >
              没有您要的游戏？
            </el-link>
          </div>
        </div>
        <div>
          <el-button size="small" type="danger" @click="$emit('close')"
            >关闭
          </el-button>
        </div>
      </div>
      <!-- 字母快速导航条 -->
      <div class="flex mt-2">
        <GameLetterIndex v-model="letter" :letters="mixedLetters" />
      </div>
    </template>
    <!-- 内容区 -->
    <el-scrollbar max-height="400">
      <div v-if="filteredData.length" class="flex flex-wrap gap-2 w-full">
        <div
          v-for="item in filteredData"
          :key="item.value"
          :title="item.label"
          class="w-40 text-xs cursor-pointer line-clamp-1 hover:underline"
          @click="handleItemClick(item)"
        >
          {{ item.label }}
        </div>
      </div>
      <el-empty v-else class="mx-auto" :image-size="100" />
    </el-scrollbar>
  </el-card>
</template>
<script lang="ts" setup>
import {Search} from "@element-plus/icons-vue";
import Fuse from 'fuse.js';
import { watchDebounced } from '@vueuse/core'

interface Props {
  data: GamePicker.SimpleOptionVM[];
  type: string;
  props?: { label: string; value: string };
}

const rootProps = withDefaults(defineProps<Props>(), {
  data: () => [],
  props: () => {
    return {label: "label", value: "value"};
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
type FuseItem = {item:GamePicker.SimpleOptionVM,refIndex:number}
const dataWithKeyword = ref<FuseItem[]>([])
const fuse = ref()

const letters = computed(():string[]=>{
  const initials=rootProps.data.filter(m=>m.initial).map((m) => m.initial!);
  return [...new Set(initials.sort())]
})

watchDebounced(()=>keyword.value,(val:string)=>{
  console.log("[game-picker] keyword.value",val)
  dataWithKeyword.value = fuse.value.search(val) as FuseItem[];
},  { debounce: 500, maxWait: 1000 })
watch(()=>rootProps.data,(val)=>{
  console.log("[game-picker] panel watch")
  fuse.value = new Fuse(val,{
  keys:['label','initial']
});
},{
  immediate:true
})

/**
 * 混合字母
 */
const mixedLetters = computed(() => {
  return [HOT, ALL,...letters.value]
})

/**
 * 过滤后的数据
 */
const filteredData = computed(() => {
  let _arr:GamePicker.SimpleOptionVM[] = []
  if (letter.value === ALL) {
    _arr = rootProps.data;
  } else if (letter.value === HOT) {
    _arr = rootProps.data.filter((item: GamePicker.SimpleOptionVM) => item.hot)
  }else{
    _arr = rootProps.data.filter((item: GamePicker.SimpleOptionVM) => item.initial === letter.value);
  }
  // keyword 过滤
  const keywordValues = dataWithKeyword.value.map(m=>m.item.value);
  if(keyword.value){
    _arr = _arr.filter(m=>keywordValues.includes(m.value))
  }
  return _arr;
})

const cleanKeyword = ()=>{
keyword.value= ""
}
const resetLetter = ()=>{
letter.value= ALL
}

const handleItemClick = (item: GamePicker.SimpleOptionVM) => {
  cleanKeyword();
  resetLetter();
  emit("itemClick", rootProps.type, item);
};

const handleRecentlyVisitedClick = (gameId:number)=>{
  emit('recentlyVisitedClick',gameId)
}
</script>
