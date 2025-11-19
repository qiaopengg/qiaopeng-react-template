import * as React from "react";

// 统一的搜索高亮方法：对匹配的文本进行浅黄色背景高亮
// 使用 try/catch 以容错包含正则特殊字符的搜索词
export function highlightText(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm) return text;
  try {
    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = String(text).split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
          {part}
        </span>
      ) : (
        <React.Fragment key={index}>{part}</React.Fragment>
      )
    );
  } catch {
    return text;
  }
}
