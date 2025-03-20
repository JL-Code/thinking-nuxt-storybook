<template>
  <UContainer>
    <UCard class="mt-10">
        <h1>Playground</h1>
    <div class="w-100">
        <GamePicker debug v-model="value" />
    </div>
   <div class="mt-2 flex flex-wrap gap-2">
        <NuxtLink to="/">返回首页</NuxtLink>
   </div>
    </UCard>
  </UContainer>
</template>


<script setup lang="ts">
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
</script>

