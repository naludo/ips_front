/**
 * API工具模块
 * 功能：封装所有后端API请求，提供统一的接口调用方式
 */
import axios from 'axios'
import type { ApiResponse, Workflow, Rule, TestResult, ErrorMessage } from '@/types'

declare global {
  interface ImportMeta {
    env: {
      VITE_API_BASE_URL?: string
    }
  }
}

const BASE_URL = '/api'


// 创建Axios实例，配置基础URL和超时时间
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000  // 60秒超时
})

// 响应拦截器：统一处理错误
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     console.log('API Error:', response)
//     return Promise.reject(error)
//   }
// )

/**
 * 上传PCAP文件
 * @param file PCAP文件对象
 * @returns 工作流ID和文件名
 */
export async function uploadFile(file: File): Promise<ApiResponse<{ workflowId: string; fileName: string }>> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/workflows/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  console.log('uploadFile', response)
  return response.data
}

/**
 * 获取工作流列表（分页）
 * @param page 页码（默认1）
 * @param size 每页数量（默认10）
 * @returns 工作流列表和分页信息
 */
export async function getWorkflows(page = 1, size = 10): Promise<ApiResponse<{
  list: Workflow[]
  total: number
  page: number
  size: number
}>> {
  const response = await api.get('/workflows', { params: { page, size } })
  console.log('getWorkflows', response)
  return response.data
}

/**
 * 获取单个工作流详情
 * @param workflowId 工作流ID
 * @returns 工作流详情
 */
export async function getWorkflow(workflowId: string): Promise<ApiResponse<Workflow>> {
  const response = await api.get(`/workflows/${workflowId}`)
  console.log('getWorkflow', response)
  return response.data
}

/**
 * 获取工作流错误信息
 * @param workflowId 工作流ID
 * @returns 错误信息
 */
export async function getWorkflowError(workflowId: string): Promise<ApiResponse<ErrorMessage>> {
  const response = await api.get(`/workflows/${workflowId}/errorMessage`)
  console.log('getWorkflowError', response)
  return response.data
}

/**
 * 结束工作流
 * @param workflowId 工作流ID
 * @returns 空响应
 */
export async function endWorkflow(workflowId: string): Promise<ApiResponse<null>> {
  const response = await api.post(`/workflows/${workflowId}/end`)
  console.log('endWorkflow', response)
  return response.data
}

/**
 * 获取规则列表
 * @param workflowId 工作流ID
 * @param status 规则状态筛选（可选）
 * @param page 页码（默认1）
 * @param size 每页数量（默认20）
 * @returns 规则列表和分页信息
 */
export async function getRules(
  workflowId: string,
  status?: string,
  page = 1,
  size = 20
): Promise<ApiResponse<{
  list: Rule[]
  total: number
  page: number
  size: number
}>> {
  const response = await api.get('/rules', { params: { workflowId, status, page, size } })
  console.log('getRules', response)
  return response.data
}

/**
 * 生成规则（触发AI规则生成）
 * @param workflowId 工作流ID
 * @returns 生成结果消息和生成的规则数量
 */
export async function generateRules(workflowId: string): Promise<ApiResponse<{ message: string; }>> {
  const response = await api.post('/rules/generate', { workflowId })
  console.log('generateRules', response)
  return response.data
}

/**
 * 重新生成规则（单条）
 * @param ruleId 要重新生成的规则ID
 * @param suggestion 用户建议，用于指导规则重新生成
 * @returns 操作结果消息
 * @说明 规则生成进度通过WebSocket消息接收，消息类型为rule_generation_progress和rule_generation_complete
 */
export async function regenerateRule(ruleId: string, suggestion?: string): Promise<ApiResponse<{ message: string }>> {
  const response = await api.put(`/rules/${ruleId}/regenerate`, { suggestion })
  console.log('regenerateRule', response)
  return response.data
}

/**
 * 更新规则内容
 * @param ruleId 规则ID
 * @param content 规则内容
 * @returns 更新后的规则ID和内容
 */
export async function updateRule(ruleId: string, content: string): Promise<ApiResponse<Rule>> {
  const response = await api.put(`/rules/${ruleId}`, { content })
  console.log('updateRule', response)
  return response.data
}

/**
 * 批量审核通过（支持单条）
 * @param ruleIds 规则ID列表，支持单条审核（传入单元素数组）
 * @returns 审核后的规则列表
 */
export async function batchApproveRules(ruleIds: string[]): Promise<ApiResponse<{
  rules: Array<{ id: string; status: 'accepted' }>
}>> {
  const response = await api.post('/rules/approve', { ruleIds })
  console.log('batchApproveRules', response)
  return response.data
}

/**
 * 启动测试
 * @param workflowId 工作流ID
 * @returns 空响应
 */
export async function startTest(workflowId: string): Promise<ApiResponse<null>> {
  const response = await api.post(`/workflow/${workflowId}/test/start`)
  console.log('startTest', response)
  return response.data
}

/**
 * 获取测试结果
 * @param workflowId 工作流ID
 * @returns 测试结果详情
 */
export async function getTestResult(workflowId: string): Promise<ApiResponse<TestResult>> {
  const response = await api.get(`/workflow/${workflowId}/result`)
  console.log('getTestResult', response)
  return response.data
}

// 导出Axios实例供外部使用
export default api