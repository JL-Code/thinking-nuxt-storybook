import type { Meta, StoryObj } from '@storybook/vue3'

import Button from './Button.vue'

const meta = {
    title: 'Button',
    component: Button,
    tags: ['autodocs'],
} satisfies Meta<typeof Button>

export default meta 
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        label: 'Button',
        size: 'medium',
    },
}   

export const Large: Story = {
    args: {
        label: 'Large Button',
        size: 'large',
    },
}
