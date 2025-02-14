// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@nuxt/ui", "@nuxtjs/storybook"],

  storybook: {
    port: 6006,
    route: '/__storybook__',
  },

  compatibilityDate: "2025-02-15",
});