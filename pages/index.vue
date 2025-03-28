<template>
  <ClientOnly>
    <UContainer>
      <UCard class="mt-10">
        <template #header>
          <div class="flex justify-between">
            <h1>Welcome to Nuxt UI Starter</h1>
            <ColorScheme>
              <USelect v-model="$colorMode.preference" :options="['system', 'light', 'dark']" />
            </ColorScheme>
          </div>
        </template>
        <UButton icon="i-heroicons-book-open" to="https://ui.nuxt.com" target="_blank">Open Nuxt UI Documentation
        </UButton>

        <Button label="Custom Button" size="large" type="success" />

        <GamePicker debug v-model="value" />

        <!-- playground -->
        <div class="mt-2 flex flex-wrap gap-2">
          <NuxtLink class="mt-2 hover:underline" v-for="item in links" :key="item.to" :to="{
            path: item.to,
            query: item.query,
          }">{{ item.label }}</NuxtLink>
        </div>
        <div>
          <p>{{ getCookie() }}</p>
          <UButton @click="setCookie">set token</UButton>
        </div>
      </UCard>
    </UContainer>
  </ClientOnly>
</template>

<script setup lang="ts">
const links = ref([
  {
    label: "王权与自由/金币",
    to: "/playground",
    query: {
      game: 332,
      region: 23967,
      server: 24103,
    },
  },
  {
    label: "魔兽60怀旧服/金币",
    to: "/playground",
    query: {
      game: 331,
      region: 24107,
    },
  },
  {
    label: "无尽冬日/金币",
    to: "/playground",
    query: {
      game: 342,
      region: 24247,
      camp: 24256,
    },
  },
]);
const value = ref<KV<number>[]>([]);

const { setCookie, getCookie } = useTokenCookie();
</script>
