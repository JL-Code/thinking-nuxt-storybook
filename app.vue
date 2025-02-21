<template>
  <UContainer>
    <UCard class="mt-10">
      <template #header>
        <div class="flex justify-between">
          <h1>Welcome to Nuxt UI Starter</h1>
          <ColorScheme
            ><USelect
              v-model="$colorMode.preference"
              :options="['system', 'light', 'dark']"
          /></ColorScheme>
        </div>
      </template>
      <UButton
        icon="i-heroicons-book-open"
        to="https://ui.nuxt.com"
        target="_blank"
        >Open Nuxt UI Documentation</UButton
      >

      <Button label="Custom Button" size="large" type="success" />

      <GamePicker debug />
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
const games = ref<GamePicker.TreeNodeVO[]>([
  {
    id: 1,
    parentId: 0,
    name: "魔兽世界美服",
    type: "game",
    typeName: "游戏",
    hot: true,
    initial: "G",
    sort: 1,
    children: [],
  },
]);
</script>
