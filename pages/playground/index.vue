<template>
  <ClientOnly>
    <UContainer>
      <UCard class="mt-10">
        <h1 class="py-2">Playground</h1>
        <div>
          <div>model:{{ value }}</div>
        </div>
        <div class="w-100 flex flex-col gap-2">
          <GamePicker v-model="value" debug @change="onChange" />
        </div>
        <div class="mt-2 flex flex-wrap gap-2">
          <NuxtLink to="/">返回首页</NuxtLink>
          <ElButton @click="resetState">重置选择器</ElButton>
        </div>

        <div class="mt-2 flex flex-wrap gap-2">
          <h1>手动设置选中值</h1>
          游戏id：
          <ElSelect v-model="gameId" placeholder="请选择游戏">
            <ElOption v-for="item in gameIds" :key="item" :label="item" :value="item" />
          </ElSelect>
          服务器索引：
          <ElSelect v-model="serverIndex" placeholder="请选择服务器">
            <ElOption v-for="item in serverIndexs" :key="item" :label="item" :value="item" />
          </ElSelect>
          <ElButton @click="setGameIdAndServerIndex(gameId, serverIndex)">设置选中值</ElButton>
        </div>
      </UCard>
    </UContainer>
  </ClientOnly>
</template>

<script setup lang="ts">
// 334 332
const gameIds = ref<number[]>([334, 332]);
const gameId = ref<number>(332);
// 24201 23966-24008
const serverIndex = ref<string>("23966-24008");
const serverIndexs = ref<string[]>(["24201", "23966-24008"]);
const value = ref<KV<number>[]>([
  {
    key: "game",
    value: 332,
  },
  {
    key: "region",
    value: 23967,
  },
  {
    key: "server",
    value: 24103,
  },
]);
const resetState = () => {
  value.value = [];
};

watch(value, (val, oldVal) => {
  if (JSON.stringify(val) !== JSON.stringify(oldVal)) {
    console.warn("[playground] model value", JSON.stringify(val), JSON.stringify(oldVal));
  }
});

const onChange = (val: KV<number>[], oldVal?: KV<number>[]) => {
  console.warn("[playground] onChange", JSON.stringify(val), JSON.stringify(oldVal));
}

/**
 *
 * @param gameId 游戏id
 * @param serverIndex 服务器索引，eg: 24104 、23970-24045
 */
function setGameIdAndServerIndex(gameId: number, serverIndex: string) {
  const params: KV<number>[] = [];
  params.push({
    key: "game",
    value: gameId,
  });
  serverIndex.split("-").forEach((s) => {
    params.push({
      key: "unknown", // FIXME: 委托给 GamePicker 根据游戏处理
      value: Number(s),
    });
  });
  value.value = params;
}
</script>
