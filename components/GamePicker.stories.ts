import type { Meta, StoryObj } from '@storybook/vue3'

import GamePickerComponent from './GamePicker.vue'
import type GamePicker from '~/types/components/GamePicker'

const meta = {
    title: 'GamePicker',
    component: GamePickerComponent,
    tags: ['autodocs'],
} satisfies Meta<typeof GamePickerComponent>

export default meta 
type Story = StoryObj<typeof meta>


const games:GamePicker.TreeNodeVO[] = [
   {
    id: 1,
    parentId: 0,
    name: 'Game 1',
    type: 'game',
    typeName: 'Game',
    hot: true,
    initial: 'G',
    sort: 1
   }
]

export const Default: Story = {
    args: {
        data: games,
        mock: true,
    },
}   

