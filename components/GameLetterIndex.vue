<template>
  <el-segmented v-model="model" :options="options" />
</template>

<script setup lang="ts">
const props = defineProps<{
  letters: string[];
}>();
const model = defineModel<string>();
const options = computed(() => {
  return props.letters.map((m) => {
    return {
      label: m,
      value: m,
    };
  });
});
</script>

<style lang="less" scoped>
/* 处理鼠标悬浮样式 */
:deep(.el-segmented) {
  .el-segmented__item:not(.is-selected) {
    &:hover {
      .el-segmented__item-label {
        color: var(--el-color-primary);
      }
    }
  }
}
</style>
