import antfu from "@antfu/eslint-config";
import tanstackQuery from "@tanstack/eslint-plugin-query";
import eslintConfigPrettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

// export default tseslint.config(
//   { ignores: ['dist'] },
//   {
//     extends: [js.configs.recommended, ...tseslint.configs.recommended],
//     files: ['**/*.{ts,tsx}'],
//     languageOptions: {
//       ecmaVersion: 2020,
//       globals: globals.browser,
//     },
//     plugins: {
//       'react-hooks': reactHooks,
//       'react-refresh': reactRefresh,
//     },
//     rules: {
//       ...reactHooks.configs.recommended.rules,
//       'react-refresh/only-export-components': [
//         'warn',
//         { allowConstantExport: true },
//       ],
//     },
//   },
// )

export default antfu(
  {
    // Type of the project. 'lib' for libraries, the default is 'app'
    type: "lib",

    // 启用缓存提升性能
    cache: true,
    cacheLocation: "node_modules/.cache/eslint",

    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "@tanstack/query": tanstackQuery
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "off",
      "react-hooks/incompatible-library": "off",
      // TanStack Query ESLint 规则
      "@tanstack/query/exhaustive-deps": "warn",
      "@tanstack/query/stable-query-client": "error",
      "@tanstack/query/no-rest-destructuring": "warn",
      "@tanstack/query/no-unstable-deps": "warn",
      "@tanstack/query/infinite-query-property-order": "warn",
      // TypeScript 规则
      "ts/explicit-function-return-type": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      // 其他规则
      "no-console": "off",
      // 禁用与 Prettier 冲突的规则
      "antfu/if-newline": "off",
      "antfu/top-level-function": "off"
    },

    // 禁用 stylistic 规则，完全交给 Prettier 处理
    stylistic: false,

    // TypeScript and Vue are autodetected, you can also explicitly enable them:
    typescript: true,

    // Disable jsonc and yaml support
    jsonc: false,
    yaml: false,

    // `.eslintignore` is no longer supported in Flat config, use `ignores` instead
    ignores: [
      "dist",
      "build",
      "node_modules",
      "docs/**/*.md", // 忽略文档中的代码示例
      "README.md", // 忽略 README 文件
      "**/*.md", // 忽略所有 markdown 文件中的代码示例
      "**/*.min.js",
      ".husky",
      ".vscode"
    ]
  },
  eslintConfigPrettier
);
