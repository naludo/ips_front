# MSW Mock Service Worker 测试指南

## 概述

本项目使用 MSW (Mock Service Worker) 作为模拟后端方案，实现完整的 API 接口模拟和 WebSocket 功能模拟，支持前端功能的独立测试和开发。

## 技术栈

- **MSW**: 2.x (Mock Service Worker)
- **测试框架**: Vitest
- **HTTP 客户端**: Axios

## 文件结构

```
src/mocks/
├── server.ts          # Node.js 端 MSW 配置（测试环境）
├── browser.ts         # 浏览器端 MSW 配置（开发环境）
├── websocket.ts       # WebSocket 模拟实现
├── setup.ts           # 测试环境初始化配置
├── index.ts           # Mock 模块入口
└── tests/
    ├── api.test.ts    # API 接口测试用例
    └── websocket.test.ts  # WebSocket 功能测试用例
```

## 功能特性

### 1. API 接口模拟

支持以下接口的完整模拟：

| 接口路径 | HTTP 方法 | 功能描述 |
|---------|----------|---------|
| `/api/workflows/upload` | POST | 上传 PCAP 文件，创建工作流 |
| `/api/workflows` | GET | 获取工作流列表（支持分页） |
| `/api/workflows/:workflowId` | GET | 获取单个工作流详情 |
| `/api/workflows/:workflowId/end` | POST | 终止工作流 |
| `/api/rules` | GET | 获取规则列表（支持按工作流和状态筛选） |
| `/api/rules/generate` | POST | 启动规则生成 |
| `/api/rules/regenerate` | PUT | 重新生成指定规则 |
| `/api/rules/:ruleId` | PUT | 更新规则内容 |
| `/api/rules/approve` | POST | 批量审核通过规则 |
| `/api/rules/reject` | POST | 批量审核驳回规则 |
| `/api/test/start` | POST | 启动规则测试 |
| `/api/test/:workflowId/result` | GET | 获取测试结果 |

### 2. WebSocket 消息模拟

支持以下消息类型的实时推送模拟：

| 消息类型 | 功能描述 | 数据结构 |
|---------|---------|---------|
| `rule_generation_progress` | 规则生成进度 | `{ workflowId, progress, message, phase, rulesGenerated }` |
| `rule_generation_complete` | 规则生成完成 | `{ workflowId, rulesCount }` |
| `rule_generation_error` | 规则生成错误 | `{ workflowId, errorCode, message }` |
| `test_phase_update` | 测试阶段更新 | `{ workflowId, progress, phase, duration }` |
| `test_complete` | 测试完成 | `{ workflowId }` |

#### 规则生成阶段（phase）

- `analyzing`: 数据包分析阶段
- `generating`: 规则生成阶段

#### 测试阶段（phase）

- `loading`: 规则加载阶段
- `replay`: 报文回放阶段
- `testing`: 命中验证阶段

## 运行测试

### 运行所有测试

```bash
npm run test
```

### 运行指定测试文件

```bash
npm run test -- src/mocks/tests/api.test.ts
```

### 监听模式（开发时使用）

```bash
npm run test:watch
```

## 开发环境配置

### 在开发环境中启用 Mock

开发环境下，MSW 会自动拦截所有 API 请求，无需修改代码。只需启动开发服务器：

```bash
npm run dev
```

### 浏览器控制台

MSW 启动成功后，浏览器控制台会显示：

```
MSW worker started successfully
```

## 测试用例覆盖

### API 测试

| 测试类别 | 测试场景 |
|---------|---------|
| Workflow API | 文件上传、获取列表、获取详情、404 错误 |
| Rule API | 获取规则、批量审核通过、批量审核驳回 |
| Test API | 启动测试、获取测试结果 |

### WebSocket 测试

| 测试类别 | 测试场景 |
|---------|---------|
| 连接管理 | 连接建立、连接关闭、无连接发送消息错误 |
| 消息处理 | 规则生成进度、测试阶段更新、完成消息 |
| 阶段转换 | 规则生成阶段转换、测试阶段转换 |

## 测试配置

### Vitest 配置文件

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    roots: ['src'],
    testMatch: ['**/tests/**/*.test.ts'],
    setupFiles: ['src/mocks/setup.ts'],
    testTimeout: 30000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
```

## 扩展指南

### 添加新的 API 接口

在 `src/mocks/server.ts` 中添加新的 handler：

```typescript
http.get('/api/your-endpoint', ({ params, request }) => {
  // 处理逻辑
  return HttpResponse.json({
    code: 200,
    message: 'success',
    data: {}
  })
})
```

### 添加新的 WebSocket 消息类型

在 `src/mocks/websocket.ts` 的 `handleSubscribe` 方法中添加：

```typescript
case 'your_message_type':
  this.simulateYourMessage(workflowId)
  break
```

## 注意事项

1. **Mock 数据隔离**: 测试环境和开发环境使用各自独立的 mock 数据
2. **请求拦截**: MSW 仅拦截 `http://localhost:3000` 开头的请求
3. **WebSocket 模拟**: 使用 `MockWebSocket` 类模拟 WebSocket 行为，支持连接、消息发送/接收、连接关闭
4. **测试超时**: WebSocket 测试可能需要较长时间，已设置 30 秒超时

## 常见问题

### Q: Mock 数据不生效？

确保已在开发服务器启动前正确加载 MSW worker，检查浏览器控制台是否有错误信息。

### Q: WebSocket 连接失败？

检查 `MockWebSocket` 是否正确覆盖了全局 WebSocket 对象，确保在测试文件中正确导入并使用。

### Q: 测试超时？

WebSocket 相关测试涉及异步延迟，可适当调整 `testTimeout` 配置。

## 版本信息

- MSW: ^2.14.4
- Vitest: ^1.5.2
- TypeScript: ^5.4.5