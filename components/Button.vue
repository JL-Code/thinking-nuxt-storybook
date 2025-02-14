<template>
  <button :class="buttonVariants({ size })">
    <template v-if="label">
      {{ label }}
    </template>
    <template v-else>
      <slot />
    </template>
  </button>
</template>

<script setup lang="ts">
import { cva,type VariantProps } from 'class-variance-authority'

withDefaults(defineProps<{
    /**
     * 按钮标签
     */
    label: string;
    /**
     * 按钮类型
     */
    type:'primary'|'success'|'warning'|'error'|'info',
    /**
     * 按钮大小
     */
    size: ButtonProps['size']
}>(),{
    size: 'medium'
}
)

const buttonVariants = cva(
    'bg-blue-500 text-white p-2 rounded-md',
    {
        variants: {
            size: {
                small: 'text-xs',
                medium: 'text-sm',
                large: 'text-lg',
            },
        },
    },
)
type ButtonProps = VariantProps<typeof buttonVariants>;
</script>
