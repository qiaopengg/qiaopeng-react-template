/**
 * 选择器类型定义
 * 职责：定义数据选择器相关的类型
 */

/**
 * 选择器函数类型
 *
 * @template TInput - 输入数据类型
 * @template TOutput - 输出数据类型
 */
export type Selector<TInput, TOutput> = (data: TInput | undefined) => TOutput;

/**
 * 带 ID 的实体类型
 *
 * @template T - ID 类型，默认为 string | number
 */
export type EntityWithId<T = string | number> = {
  id: T;
  [key: string]: unknown;
};

/**
 * 分页数据类型
 *
 * @template T - 数据项类型
 */
export type PaginatedData<T> = {
  items: T[];
  total?: number;
  [key: string]: unknown;
};
