# IPS测试系统 - 前端应用

基于 Vue 3 + TypeScript + Element Plus 构建的IPS测试系统前端应用。

## 功能特性

### 阶段1：PCAP文件上传
- 支持点击选择或拖拽上传PCAP文件（.zip格式）
- 文件格式和大小验证
- 实时上传进度显示
- 获取后端创建的workflowId并建立WebSocket连接

### 阶段2：规则生成
- 触发规则生成流程
- WebSocket实时接收规则生成进度
- 进度条展示生成状态
- 生成完成自动跳转规则列表

### 阶段3：规则审查
- 规则状态管理（待审核/已通过/已拒绝）
- 支持规则通过、拒绝、编辑、重新生成操作
- 批量重新生成规则
- 拒绝规则需填写拒绝原因

### 阶段4：回放测试
- 筛选审核通过的规则进行测试
- WebSocket实时接收测试进度和阶段状态
- 测试结果可视化展示（命中/未命中/错误统计）
- 支持导出测试报告

## 技术栈

- **框架**: Vue 3 + Composition API
- **语言**: TypeScript
- **UI库**: Element Plus
- **路由**: Vue Router
- **构建工具**: Vite
- **测试框架**: Vitest
- **HTTP客户端**: Axios

## 项目结构

```
src/
├── components/          # 组件目录
├── views/              # 页面视图
│   ├── PacketUpload.vue   # 文件上传页面
│   ├── RuleList.vue       # 规则审查页面
│   └── TestResult.vue     # 测试结果页面
├── router/             # 路由配置
│   └── index.ts
├── stores/             # 状态管理
│   └── workflow.ts
├── types/              # 类型定义
│   └── index.ts
├── utils/              # 工具函数
│   ├── api.ts            # API接口封装
│   └── websocket.ts      # WebSocket管理
├── tests/              # 单元测试
│   ├── utils/
│   │   └── api.test.ts
│   └── stores/
│       └── workflow.test.ts
├── App.vue             # 根组件
├── main.ts             # 入口文件
└── style.css           # 全局样式
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 运行单元测试

```bash
npm run test
```

### 预览生产版本

```bash
npm run preview
```

## API接口说明

### 基础URL
- 开发环境: `http://localhost:8080/api`

### 主要接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/workflows/upload` | POST | 文件上传 |
| `/api/workflows` | GET | 获取工作流列表 |
| `/api/workflows/{workflowId}` | GET | 获取工作流详情 |
| `/api/rules` | GET | 获取规则列表 |
| `/api/rules/generate` | POST | 生成规则 |
| `/api/rules/{ruleId}` | PUT | 更新规则 |
| `/api/rules/regenerate` | PUT | 重新生成规则 |
| `/api/test/start` | POST | 启动测试 |
| `/api/test/{workflowId}/result` | GET | 获取测试结果 |

### WebSocket连接
- 地址: `ws://{host}/ws/workflows/{workflowId}`
- 支持消息类型: rule_generation_progress, rule_generation_complete, test_progress, test_phase_update, test_complete

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| VITE_API_BASE_URL | API基础地址 | http://localhost:8080/api |

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge