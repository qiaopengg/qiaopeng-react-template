# Indicator Management 模块代码片段使用指南

基于 `indicator-management` 模块创建的专用代码片段，用于快速生成标准化的模块文件。

## 代码片段列表

### 1. `itypes` - Types 文件模板
**触发词**: `itypes`
**用途**: 生成基于 indicator-management 的 types.ts 文件模板

**包含内容**:
- 主要实体数据结构接口
- 列表项数据结构接口  
- 分页响应数据结构接口
- 查询参数接口
- 编辑参数接口
- 新增参数接口
- API 响应数据结构接口
- 页面缓存数据结构接口

**使用方法**:
1. 创建新的 `types.ts` 文件
2. 输入 `itypes` 并按 Tab 键
3. 按照提示填写模块名称、实体名称等信息

### 2. `iapi` - API 文件模板
**触发词**: `iapi`
**用途**: 生成基于 indicator-management 的 api.ts 文件模板

**包含内容**:
- 查询键配置
- API 函数定义（获取分页数据、编辑、删除、新增、切换状态）
- React Query Hooks（列表查询、新增变更、编辑变更、删除变更、状态切换变更）
- 错误处理和类型安全

**使用方法**:
1. 创建新的 `api.ts` 文件
2. 输入 `iapi` 并按 Tab 键
3. 按照提示填写模块名称、实体名称、API 路径等信息

### 3. `ihooks` - Hooks 文件模板
**触发词**: `ihooks`
**用途**: 生成基于 indicator-management 的 hooks.ts 文件模板

**包含内容**:
- 页面业务逻辑 Hook（状态管理、操作处理）
- 查询参数 Hook（URL 参数解析）
- 表单 Hook（表单提交逻辑）
- 完整的 CRUD 操作处理

**使用方法**:
1. 创建新的 `hooks.ts` 文件
2. 输入 `ihooks` 并按 Tab 键
3. 按照提示填写模块名称、实体名称等信息

### 4. `iindex` - Index 文件模板
**触发词**: `iindex`
**用途**: 生成基于 indicator-management 的 index.tsx 文件模板

**包含内容**:
- 完整的页面组件结构
- 搜索表单和验证
- 数据表格配置
- 编辑抽屉组件
- 删除确认对话框
- 响应式布局和错误处理

**使用方法**:
1. 创建新的 `index.tsx` 文件
2. 输入 `iindex` 并按 Tab 键
3. 按照提示填写实体名称、模块标题等信息

## 快速创建新模块步骤

### 方法一：使用代码片段
1. 创建新的模块目录：`src/pages/your-module-name/`
2. 在目录中创建四个文件：`types.ts`、`api.ts`、`hooks.ts`、`index.tsx`
3. 分别在每个文件中使用对应的代码片段：
   - `types.ts` → 输入 `itypes`
   - `api.ts` → 输入 `iapi`
   - `hooks.ts` → 输入 `ihooks`
   - `index.tsx` → 输入 `iindex`
4. 按照提示填写相关信息
5. 根据具体需求调整生成的代码

### 方法二：结合脚本使用
1. 先使用 `scripts/generate-module.sh` 脚本生成基础结构
2. 然后使用代码片段覆盖生成更符合 indicator-management 模式的代码

## 代码片段变量说明

生成代码片段时，需要填写以下变量：

- `${1:模块名称}`: 模块的中文名称（如：指标管理）
- `${2:EntityName}`: 实体的 PascalCase 名称（如：Indicator）
- `${3:实体名称}`: 实体的中文名称（如：指标）
- `${4:module-name}`: 模块的 kebab-case 名称（如：indicator-management）
- `${5:实体名称}`: 实体的中文名称（如：指标）

## 注意事项

1. **类型安全**: 所有代码片段都包含完整的 TypeScript 类型定义
2. **错误处理**: 包含统一的错误处理机制
3. **国际化**: 支持中文界面和提示信息
4. **响应式**: 生成的组件支持响应式布局
5. **可扩展**: 代码结构便于后续扩展和维护

## 自定义修改

生成代码后，根据具体业务需求可能需要调整：

1. **字段定义**: 在 types.ts 中添加或修改字段
2. **API 路径**: 在 api.ts 中调整 API 端点
3. **业务逻辑**: 在 hooks.ts 中添加特定的业务处理
4. **UI 组件**: 在 index.tsx 中调整界面布局和交互

## 故障排除

如果代码片段无法正常工作：

1. 确保 VS Code 已重新加载配置
2. 检查文件扩展名是否正确（.ts/.tsx）
3. 确认光标位置在空白行
4. 尝试重启 VS Code

## 相关文件

- 代码片段配置：`.vscode/indicator-module.code-snippets`
- 模块生成脚本：`scripts/generate-module.sh`
- 开发指南：`DEVELOPMENT_GUIDE.md`
- 模块标准：`docs/MODULE_STANDARD.md`