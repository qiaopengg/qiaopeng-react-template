# Smart Review 前端项目

基于 React + TypeScript 的现代前端项目，采用标准化分层架构，集成 TanStack Query 进行服务端状态管理。

## 技术栈

- **框架**：React 19 + TypeScript 5 + Vite 6
- **状态管理**：TanStack Query 5（服务端状态与缓存）
- **UI 组件**：shadcn/ui + Radix UI（无障碍基础组件）
- **样式**：Tailwind CSS 4
- **表单**：React Hook Form + Zod
- **HTTP 客户端**：Axios
- **代码规范**：ESLint 9 + Stylelint 16 + Prettier + Husky 9

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 项目架构

### 业务模块分层架构

每个业务模块遵循统一的分层结构（以 `indicator-management` 为例）：

```
src/pages/indicator-management/
├── api/                    # 接口层
│   ├── list.ts            # 列表相关 API
│   ├── form.ts            # 表单相关 API
│   └── index.ts           # 统一导出
├── hooks/                 # 业务逻辑层
│   ├── useList.ts         # 列表业务逻辑
│   ├── useForm.ts         # 表单业务逻辑
│   ├── useColumns.tsx     # 表格列定义
│   ├── useFieldEnricher.ts # 字段映射工具
│   └── index.ts           # 统一导出
├── components/            # 组件层
│   └── form.tsx           # 表单组件
├── types/                 # 类型定义层
│   ├── list.ts            # 列表类型
│   ├── form.ts            # 表单类型
│   └── index.ts           # 统一导出
├── shared/                # 共享层
│   └── index.ts           # Query Keys、常量
└── page.tsx               # 页面入口
```

### 分层职责

| 层级 | 职责 | 示例 |
|------|------|------|
| **api/** | 封装 HTTP 请求，定义 TanStack Query Options | `useIndicatorListQuery` |
| **hooks/** | 业务逻辑、状态管理、数据转换 | `useIndicatorManagementPage` |
| **components/** | 可复用的业务组件，纯 UI 渲染 | `IndicatorForm` |
| **types/** | TypeScript 类型定义 | `IIndicatorItem` |
| **shared/** | Query Keys、Mutation Keys、常量 | `indicatorKeys` |
| **page.tsx** | 页面入口，组装组件和 Hooks | 主页面 |

### 命名规范

- **Hooks 文件**：`use` 前缀（`useList.ts`、`useForm.ts`）
- **API 文件**：按功能命名（`list.ts`、`form.ts`）
- **类型文件**：按功能命名（`list.ts`、`form.ts`）
- **组件文件**：PascalCase（`FormComponent.tsx`）

## TanStack Query 文件层级

### 模块内的 TanStack Query 组织

```
src/pages/indicator-management/
├── api/                           # TanStack Query 层
│   ├── list.ts                   # 列表相关
│   │   ├── getIndicatorList()    # API 函数
│   │   ├── useIndicatorListQuery() # Query Hook
│   │   ├── useDeleteIndicatorMutation() # Mutation Hook
│   │   └── listQueryOptions      # Query Options 配置
│   ├── form.ts                   # 表单相关
│   │   ├── getIndicatorDetail()  # API 函数
│   │   ├── useIndicatorDetailQuery() # Query Hook
│   │   ├── useAddIndicatorMutation() # Mutation Hook
│   │   └── formQueryOptions      # Query Options 配置
│   └── index.ts                  # 统一导出
├── shared/                        # Query Keys 管理
│   └── index.ts
│       ├── indicatorKeys         # Query Keys 定义
│       └── indicatorMutationKeys # Mutation Keys 定义
└── hooks/                         # 业务逻辑层（使用 Query Hooks）
    ├── useList.ts                # 调用 useIndicatorListQuery
    └── useForm.ts                # 调用 useIndicatorDetailQuery
```

### 文件职责说明

**api/list.ts - 列表相关 Query**
- 定义 API 函数（如 `getIndicatorList`）
- 导出 Query Hooks（如 `useIndicatorListQuery`）
- 导出 Mutation Hooks（如 `useDeleteIndicatorMutation`）
- 配置乐观更新逻辑

**api/form.ts - 表单相关 Query**
- 定义 API 函数（如 `getIndicatorDetail`、`createIndicator`）
- 导出 Query Hooks（如 `useIndicatorDetailQuery`）
- 导出 Mutation Hooks（如 `useAddIndicatorMutation`）
- 配置乐观更新逻辑

**shared/index.ts - Query Keys 管理**
- 定义 Query Keys 层级结构
- 定义 Mutation Keys
- 确保 Query Keys 的唯一性和可维护性

**hooks/ - 业务逻辑层**
- 调用 api/ 中的 Query Hooks
- 处理业务逻辑和状态管理
- 不直接调用 HTTP 请求

## 代码规范

### 自动化工具

- **Prettier**：代码格式化
- **ESLint**：代码质量检查
- **Stylelint**：样式检查
- **lint-staged**：提交前检查暂存文件
- **husky**：Git 钩子管理
- **commitlint**：提交信息规范

### 常用命令

```bash
# 格式化代码
npm run format

# 检查所有问题
npm run lint

# 自动修复问题
npm run lint:fix
```

### 提交前自动检查

提交代码时会自动执行：
1. 格式化暂存文件
2. 运行 ESLint 和 Stylelint
3. 检查提交信息格式

## Git 提交规范

### 提交信息格式

```
type(scope): subject

示例：
feat(indicator-management): 新增指标列表功能
fix(TreeSelect): 修复多选清空问题
refactor(hooks): 重构表单逻辑
docs(README): 更新架构说明
```

### 提交类型

- `feat`: 新功能
- `fix`: 修复 bug
- `refactor`: 重构
- `docs`: 文档更新
- `style`: 代码格式调整
- `perf`: 性能优化
- `test`: 测试相关
- `build`: 构建系统或依赖更新
- `ci`: CI/CD 配置更新
- `chore`: 其他杂项

### 提交流程

```bash
# 1. 添加文件
git add .

# 2. 提交（会自动检查和格式化）
git commit -m "feat: 新功能"

# 3. 如果检查失败，修复后重新提交
npm run lint:fix
git add .
git commit -m "feat: 新功能"
```

### 跳过检查（紧急情况）

```bash
git commit --no-verify -m "fix: 紧急修复"
```

⚠️ **注意**：跳过本地检查的代码仍会在 CI/CD 中被检查！

## 环境配置

### 环境变量

在 `.env.development` / `.env.production` 中配置：

```bash
# API 地址
VITE_APP_API_IP=https://your-api-host.example.com
```

### HTTP 请求

- 自动注入 `Authorization` 头（Bearer token）
- 统一错误处理和消息提示
- 请求去重和并发控制

## 示例模块

查看 `src/pages/indicator-management` 了解完整的模块实现：

1. **类型定义**：`types/list.ts` 和 `types/form.ts`
2. **API 层**：`api/list.ts` 和 `api/form.ts`
3. **业务逻辑**：`hooks/useList.ts` 和 `hooks/useForm.ts`
4. **页面组装**：`page.tsx`

## 维护信息

- 维护者：qiaopeng
- 最后更新：2025-11-10
