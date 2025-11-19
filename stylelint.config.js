export default {
  extends: ["stylelint-config-standard"],
  rules: {
    // 允许 Tailwind CSS 的 @ 指令
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: [
          "apply",
          "config",
          "custom-variant",
          "layer",
          "responsive",
          "screen",
          "theme",
          "tailwind",
          "variants"
        ]
      }
    ],
    // 允许 Tailwind CSS 的 @apply 指令（虽然新版本不推荐）
    "at-rule-no-deprecated": null,
    // 允许空文件（有些文件可能只是用来导入其他文件）
    "no-empty-source": null,
    // 允许一些浏览器兼容性的写法
    "selector-pseudo-element-no-unknown": [
      true,
      {
        ignorePseudoElements: ["input-placeholder"]
      }
    ],
    // 允许重复的字体名称（normalize.css 中的 monospace）
    "font-family-no-duplicate-names": null,
    // 允许简写属性覆盖（reset.css 中的 font 简写）
    "declaration-block-no-shorthand-property-overrides": null,
    // 允许不使用url()的@import (Tailwind CSS v4需要)
    "import-notation": null,
    // 不强制修改自定义属性值
    "custom-property-pattern": null,
    // 不自动修复import语句
    "function-url-quotes": null,
    // 允许 BEM 命名规范和第三方库的类名（如 react-flow__node）
    "selector-class-pattern": null
  }
};
