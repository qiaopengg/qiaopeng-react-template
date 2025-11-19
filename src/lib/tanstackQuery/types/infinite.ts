/**
 * 无限查询类型定义
 * 定义无限滚动和分页查询的类型，支持游标分页、偏移量分页、页码分页
 */

/**
 * 游标分页响应
 * @template T - 数据项类型
 * @property {T[]} items - 当前页数据列表
 * @property {string | null} [cursor] - 下一页游标（null 表示无更多数据）
 * @property {boolean} [hasMore] - 是否有更多数据
 */
export interface CursorPaginatedResponse<T> {
  items: T[];
  cursor?: string | null;
  hasMore?: boolean;
}

/**
 * 偏移量分页响应
 * @template T - 数据项类型
 * @property items - 当前页数据列表
 * @property offset - 当前偏移量
 * @property limit - 每页数量限制
 * @property total - 总数据量
 * @property hasMore - 是否有更多数据
 */
export interface OffsetPaginatedResponse<T> {
  items: T[];
  offset: number;
  limit: number;
  total: number;
  hasMore?: boolean;
}

/**
 * 页码分页响应
 * @template T - 数据项类型
 */
export interface PageNumberPaginatedResponse<T> {
  items: T[]; // 当前页数据列表
  page: number; // 当前页码（从 1 开始）
  pageSize: number; // 每页数量
  totalPages: number; // 总页数
  totalItems: number; // 总数据量
}

/**
 * 通用分页参数
 */
export interface PaginationParams {
  cursor?: string; // 游标分页：下一页游标
  offset?: number; // 偏移量分页：偏移量
  page?: number; // 页码分页：页码
  limit?: number; // 每页数量限制
  pageSize?: number; // 每页数量（页码分页）
}

/**
 * 分页元数据
 */
export interface PaginationMeta {
  currentPage?: number; // 当前页码
  totalPages?: number; // 总页数
  totalItems?: number; // 总数据量
  pageSize?: number; // 每页数量
  hasNextPage?: boolean; // 是否有下一页
  hasPreviousPage?: boolean; // 是否有上一页
}

/**
 * 带元数据的分页响应
 * @template T - 数据项类型
 */
export interface PaginatedResponseWithMeta<T> {
  items: T[]; // 数据项列表
  meta: PaginationMeta; // 分页元数据
}
