<template>
  <UContainer>
    <UCard class="mt-10">
      <h1 class="py-2">Playground</h1>
      <div class="w-100 flex flex-col gap-2">
        <GamePicker v-model="value" />
        <!-- <GamePicker2 v-model="model2" /> -->
      </div>
      <div class="mt-2 flex flex-wrap gap-2">
        <NuxtLink to="/">返回首页</NuxtLink>
        <ElButton @click="resetState">重置选择器</ElButton>
      </div>
      <div class="mt-2 flex flex-wrap gap-2">
        游戏id：
        <ElInput v-model="gameId" />
        服务器索引：
        <ElInput v-model="serverIndex" />
        <ElButton @click="setGameIdAndServerIndex(gameId, serverIndex)">设置选中值</ElButton>
      </div>
    </UCard>
  </UContainer>
</template>


<script setup lang="ts">
const gameId = ref<number>(332);
const serverIndex = ref<string>("23966-24008");
const value = ref<KV<number>[]>([{
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
/**
 *
 * @param gameId 游戏id
 * @param serverIndex 服务器索引，eg: 24104 、23970-24045
 */
function setGameIdAndServerIndex(gameId: number, serverIndex: string) {
  const params: KV<number>[] = []
  params.push({
    key: 'game',
    value: gameId
  })
  serverIndex.split('-').forEach(s => {
    params.push({
      key: 'unknown', // FIXME: 委托给 GamePicker 根据游戏处理
      value: Number(s)
    })
  });
  value.value = params;
}
</script>
