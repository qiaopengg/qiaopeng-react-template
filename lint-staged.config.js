export default {
  // JS/TS 文件
  "*.{ts,tsx,js,jsx}": ["eslint --fix --max-warnings 0 --cache", "prettier --write"],

  // 样式文件
  "*.{css,scss,less}": ["stylelint --fix --cache", "prettier --write"],

  // 其他文件只格式化
  "*.{json,md,yml,yaml}": ["prettier --write"]
};
