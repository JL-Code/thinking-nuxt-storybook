import { defineConfig } from "unocss";

export default defineConfig({
  content: {
    pipeline: {
      include: [
        // the default
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        // include js/ts files
        "components/**/*.{js,ts}",
      ],
    },
  },
  shortcuts: [],
  theme: {
    colors: {
      primary: "var(--el-color-primary)",
      danger: "var(--el-color-danger)",
      warning: "var(--el-color-warning)",
      success: "var(--el-color-success)",
      info: "var(--el-color-info)",
    },
  },
});
