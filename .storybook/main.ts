import type { StorybookConfig } from "@storybook-vue/nuxt";

const config: StorybookConfig = {
  stories: [
    "../components/**/*.mdx",
    "../components/**/*.stories.@(js|jsx|ts|tsx|mdx)",
  ],
  addons: [
    "@storybook/addon-essentials",
    "@chromatic-com/storybook",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook-vue/nuxt",
    options: {
      // [Bug]: Stories display controls as string or object with Vue 3 using cva
      //  @see https://github.com/storybookjs/storybook/issues/26309
      docgen: "vue-component-meta",
    },
  },
};
export default config;
