/**
 * 通用分页响应类型（公共类型）
 * 统一模块内的分页返回结构，避免每个模块重复定义。
 */

export interface PageResult<T> {
  /** 当前页数据行 */
  Rows: T[];
  /** 总条数 */
  Total: number;
}
