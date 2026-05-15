# IPS测试系统 - API接口文档

## 1. 概述

本文档描述了IPS测试系统前端与后端之间的API接口规范。

## 2. 基础配置

### 2.1 基础URL
### 2.2 通用响应格式

所有接口返回统一格式：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | number | 状态码，200表示成功 |
| message | string | 提示信息 |
| data | any | 响应数据 |

## 3. 工作流接口

### 3.1 文件上传（创建工作流）

**接口说明**: 上传PCAP文件，后端创建工作流并返回ID

**请求URL**: `POST /api/workflows/upload`

**请求方法**: `POST`

**请求参数**:

| 参数名 | 类型 | 是否必填 | 说明 |
|--------|------|----------|------|
| file | File | 是 | PCAP文件（.zip格式，最大200MB） |

**响应格式**:

```json
{
  "code": 200,
  "message": "文件上传成功",
  "data": {
    "workflowId": "workflow-xxx",
    "fileName": "test.pcap.zip"
  }
}
```

**错误响应**:

```json
{
  "code": 400,
  "message": "文件格式不正确，请上传.zip文件",
  "data": null
}
```

---

### 3.2 获取工作流列表

**接口说明**: 分页获取工作流列表

**请求URL**: `GET /api/workflows`

**请求方法**: `GET`

**请求参数**:

| 参数名 | 类型 | 是否必填 | 说明 |
|--------|------|----------|------|
| page | number | 否 | 页码，默认1 |
| size | number | 否 | 每页数量，默认10 |

**响应格式**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "workflowId": "workflow-xxx",
        "status": "completed",
        "createTime": "2024-01-20T10:00:00Z",
        "updateTime": "2024-01-20T10:30:00Z",
        "rulesTotal": 20,
        "rulesApproved": 15,
        "isCompleted": true,
        "fileName": "test.pcap.zip"
      }
    ],
    "total": 100,
    "page": 1,
    "size": 10
  }
}
```

---

### 3.3 获取工作流详情

**接口说明**: 根据工作流ID获取详情

**请求URL**: `GET /api/workflows/{workflowId}`

**请求方法**: `GET`

**路径参数**:

| 参数名 | 类型 | 说明 |
|--------|------|------|
| workflowId | string | 工作流ID |

**响应格式**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "workflowId": "workflow-xxx",
    "status": "completed",
    "createTime": "2024-01-20T10:00:00Z",
    "updateTime": "2024-01-20T10:30:00Z",
    "rulesTotal": 25,
    "rulesApproved": 20,
    "isCompleted": true,
    "fileName": "test.pcap.zip"
  }
}
```

---

### 3.4 终止工作流

**接口说明**: 将工作流标记为已完成状态

**请求URL**: `POST /api/workflows/{workflowId}/end`

**请求方法**: `POST`

**路径参数**:

| 参数名 | 类型 | 说明 |
|--------|------|------|
| workflowId | string | 工作流ID |

**响应格式**:

```json
{
  "code": 200,
  "message": "工作流已终止",
  "data": null
}
```

---

## 4. 规则接口

### 4.1 获取规则列表

**接口说明**: 获取指定工作流的规则列表，支持状态筛选

**请求URL**: `GET /api/rules`

**请求方法**: `GET`

**请求参数**:

| 参数名 | 类型 | 是否必填 | 说明 |
|--------|------|----------|------|
| workflowId | string | 是 | 工作流ID |
| status | string | 否 | 规则状态：pending/approved/rejected |
| page | number | 否 | 页码，默认1 |
| size | number | 否 | 每页数量，默认20 |

**响应格式**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": "rule-xxx",
        "workflowId": "workflow-xxx",
        "content": "alert tcp any any -> any any (msg:\"Test Rule\"; sid:10001;)",
        "protocol": "TCP",
        "attackType": "SQL注入",
        "status": "pending",
        "targetPacket": "String(规则所应用的报文文件名)"
      }
    ],
    "total": 15,
    "page": 1,
    "size": 20
  }
}
```

---

### 4.2 生成规则

**接口说明**: 触发后端规则生成流程

**请求URL**: `POST /api/rules/generate`

**请求方法**: `POST`

**请求参数**:

| 参数名 | 类型 | 是否必填 | 说明 |
|--------|------|----------|------|
| workflowId | string | 是 | 工作流ID |

**响应格式**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "message": "规则生成已启动"
  }
}
```

---

### 4.3 重新生成规则

**接口说明**: 重新生成指定的规则(后端将规则重置为pending状态)

**请求URL**: `PUT /api/rules/regenerate`

**请求方法**: `PUT`

**请求参数**:

| 参数名 | 类型 | 是否必填 | 说明 |
|--------|------|----------|------|
| ruleIds | string[] | 是 | 规则ID列表 |

**响应格式**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "message": "规则重新生成成功",
    "rules": [
      {
        "id": "rule-xxx",
        "workflowId": "workflow-xxx",
        "content": "alert tcp any any -> any any (msg:\"Regenerated Rule\"; sid:10002;)",
        "protocol": "UDP",
        "attackType": "XSS攻击",
        "status": "pending",
        "targetPacket": "String(规则所应用的报文文件名)"
      }
    ]
  }
}
```

---

### 4.4 更新规则内容

**接口说明**: 更新单条规则的内容

**请求URL**: `PUT /api/rules/{ruleId}`

**请求方法**: `PUT`

**路径参数**:

| 参数名 | 类型 | 说明 |
|--------|------|------|
| ruleId | string | 规则ID |

**请求参数**:

| 参数名 | 类型 | 是否必填 | 说明 |
|--------|------|----------|------|
| content | string | 是 | 新的规则内容 |

**响应格式**:

```json
{
  "code": 200,
  "message": "规则更新成功",
  "data": {
    "id": "rule-xxx",
    "workflowId": "workflow-xxx",
    "content": "alert tcp any any -> any any (msg:\"Regenerated Rule\"; sid:10002;)",
    "protocol": "UDP",
    "attackType": "XSS攻击",
    "status": "pending",
    "targetPacket": "String(规则所应用的报文文件名)"
  }
}
```

### 4.5 批量审核通过(兼容单条)

**接口说明**: 批量将多条规则标记为审核通过状态

**请求URL**: `POST /api/rules/approve`

**请求方法**: `POST`

**请求参数**:

| 参数名 | 类型 | 是否必填 | 说明 |
|--------|------|----------|------|
| ruleIds | string[] | 是 | 规则ID列表 |

**响应格式**:

```json
{
  "code": 200,
  "message": "审核通过成功",
  "data": {
    "rules": [
      { "id": "rule-xxx", "status": "approved" },
      { "id": "rule-yyy", "status": "approved" }
    ]
  }
}
```

---

### 4.6 批量审核驳回

**接口说明**: 批量将多条规则标记为审核驳回状态

**请求URL**: `POST /api/rules/reject`

**请求方法**: `POST`

**请求参数**:

| 参数名 | 类型 | 是否必填 | 说明 |
|--------|------|----------|------|
| ruleIds | string[] | 是 | 规则ID列表 |

**响应格式**:

```json
{
  "code": 200,
  "message": "审核驳回成功",
  "data": {
    "rules": [
      { "id": "rule-xxx", "status": "rejected" },
      { "id": "rule-yyy", "status": "rejected" }
    ]
  }
}
```

---


---

## 5. 测试接口

### 5.1 启动测试

**接口说明**: 启动回放测试，传递审核通过的规则列表

**请求URL**: `POST /api/test/start`

**请求方法**: `POST`

**请求参数**:

| 参数名 | 类型 | 是否必填 | 说明 |
|--------|------|----------|------|
| workflowId | string | 是 | 工作流ID |
| ruleIds | string[] | 是 | 审核通过的规则ID列表 |

**响应格式**:

```json
{
  "code": 200,
  "message": "测试已启动",
  "data": null
}
```

---

### 5.2 获取测试结果

**接口说明**: 获取指定工作流的测试结果

**请求URL**: `GET /api/test/{workflowId}/result`

**请求方法**: `GET`

**路径参数**:

| 参数名 | 类型 | 说明 |
|--------|------|------|
| workflowId | string | 工作流ID |

**响应格式**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "workflowId": "workflow-xxx",
    "totalRules": 10,
    "hitCount": 5,
    "missCount": 4,
    "errorCount": 1,
    "rules": [
      {
        "id": "rule-xxx",
        "workflowId": "workflow-xxx",
        "content": "alert tcp any any -> any any (msg:\"Test\"; sid:10001;)",
        "protocol": "TCP",
        "attackType": "SQL注入",
        "status": "approved",
        "hitPacket": ["packet1", "packet2"]
      }
    ],
    "phases": {
      "loading": 30,
      "replay": 60,
      "testing": 120
    },
    "startTime": "2024-01-20T10:00:00Z",
    "endTime": "2024-01-20T10:05:00Z"
  }
}
```

---

## 6. WebSocket接口

### 6.1 连接地址

```
ws://{host}/ws/workflows/{workflowId}
```
### 6.2 建立连接后，前端向后端发送订阅消息

| 消息类型 | 说明 | 数据结构 |
|----------|------|----------|
| subscribe | 订阅消息类型 | `{ type: 'subscribe', workflowId, subscribeTypes }` |
---

### 6.3 消息类型(subscribeTypes消息枚举)

| 消息类型 | 说明 | 数据结构                                                                                            |
|----------|------|-------------------------------------------------------------------------------------------------|
| rule_generation_progress | 规则生成进度 | `{ workflowId, progress(0-100),message,phase(analyzing,generating), rulesGenerated(已生成的规则数量) }` |
| rule_generation_complete | 规则生成完成 | `{ workflowId, rulesCount }`                                                                    |
| rule_generation_error | 规则生成错误 | `{ workflowId, errorCode, message }`                                                            | |
| test_phase_update | 测试阶段更新 | `{ workflowId, progress(0-100),phase(loading:规则加载,replay:报文回放,testing:命中验证), duration }`        |
| test_complete | 测试完成 | `{ workflowId }`                                                                                | |
## 7. 数据类型定义

### 7.1 Rule（规则）

| 字段 | 类型 | 说明                            |
|--|------|-------------------------------|
| id | string | 规则ID                          |
| workflowId | string | 所属工作流ID                       |
| content | string | 规则内容（Snort格式）                 |
| protocol | string | 协议类型（TCP/UDP等）                |
| attackType | string | 攻击类型                          |
| status | string | 状态（pending/approved/rejected） |
| targetPacket | string | 规则应用的报文名（根据该报文文件生成的规则）        |

### 7.2 TestedRule（规则）

| 字段         | 类型       | 说明             |
|------------|----------|----------------|
| id         | string   | 规则ID           |
| workflowId | string   | 所属工作流ID        |
| content    | string   | 规则内容（Snort格式）  |
| protocol   | string   | 协议类型（TCP/UDP等） |
| attackType | string   | 攻击类型           |
| status     | string   | 状态（approved）   |
| hitPacket  | string[] | 命中的pcap包名      |

### 7.3 Workflow（工作流）

| 字段 | 类型 | 说明 |
|------|------|------|
| workflowId | string | 工作流ID |
| status | string | 状态（uploading/generating/testing/completed） |
| createTime | string | 创建时间 |
| updateTime | string | 更新时间 |
| rulesTotal | number | 规则总数 |
| rulesApproved | number | 已通过规则数 |
| isCompleted | boolean | 是否已完成 |
| fileName | string | 上传的文件名 |

### 7.4 TestResult（测试结果）

| 字段 | 类型           | 说明       |
|------|--------------|----------|
| workflowId | string       | 工作流ID    |
| totalRules | number       | 测试规则总数   |
| hitCount | number       | 命中数      |
| missCount | number       | 未命中数     |
| errorCount | number       | 错误数      |
| rules | TestedRule[] | 测试后的规则列表 |
| phases | object       | 各阶段耗时    |
| startTime | string       | 开始时间     |
| endTime | string       | 结束时间     |

### 7.5 WebSocket 消息类型

### SubscribeRequest(订阅消息)
| 字段             | 类型               | 说明                                                                                                    |
|----------------|------------------|-------------------------------------------------------------------------------------------------------|
| type           | string           | `subscribe`                                                                                           |
| workflowId     | string           | 工作流ID                                                                                                 |
| subscribeTypes | SubscribeTypes[] | { 'rule_generation_progress','rule_generation_complete','rule_generation_error','test_phase_update', 'test_complete'} |


**请求格式**:

```json
{
  "type": "subscribe",
  "workflowId": "workflow-abc123",
  "subscribeTypes": [
    "rule_generation_progress",
    "rule_generation_complete",
    "rule_generation_error",
    "test_phase_update",
    "test_complete"
  ]
}
```
#### 7.5.1 RuleGenerationProgressMessage（规则生成进度消息）

| 字段             | 类型 | 说明                                 |
|----------------|------|------------------------------------|
| type           | string | 消息类型标识， `rule_generation_progress` |
| workflowId     | string | 工作流ID                              |
| progress       | number | 生成进度（0-100）                        |
| message        | string | 当前状态描述消息                           |
| phase          | string | 规则生成阶段（analyzing,generating）       |
| rulesGenerated | number | 已生成的规则数量                           |

#### 7.5.2 RuleGenerationCompleteMessage（规则生成完成消息）

| 字段 | 类型 | 说明 |
|------|------|------|
| type | string | 消息类型标识，`rule_generation_complete` |
| workflowId | string | 工作流ID |
| rulesCount | number | 生成的规则总数 |

#### 7.5.3 RuleGenerationErrorMessage（规则生成错误消息）

| 字段 | 类型 | 说明 |
|------|------|------|
| type | string | 消息类型标识， `rule_generation_error` |
| workflowId | string | 工作流ID |
| errorCode | string | 错误代码 |
| message | string | 错误描述信息 |

#### 7.5.4 TestPhaseUpdateMessage（测试阶段更新消息）

| 字段 | 类型 | 说明                             |
|------|------|--------------------------------|
| type | string | 消息类型标识， `test_phase_update`    |
| workflowId | string | 工作流ID                          |
| progress | number | 测试进度（0-100）                    |
| phase | string | 当前测试阶段（loading,replay,testing） |
| duration | number | 当前阶段耗时（毫秒）                     |

#### 7.5.5 TestCompleteMessage（测试完成消息）

| 字段 | 类型 | 说明 |
|------|------|------|
| type | string | 消息类型标识， `test_complete` |
| workflowId | string | 工作流ID |