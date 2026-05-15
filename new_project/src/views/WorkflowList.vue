<template>
  <div class="workflow-list-container">
    <aside class="sidebar">
      <div class="logo-section">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span class="logo-text">IPS测试系统</span>
      </div>
      <nav class="nav-menu">
        <button
          v-for="item in navItems"
          :key="item.path"
          :class="{ active: currentPath === item.path }"
          @click="navigateTo(item.path)"
        >
          <svg :viewBox="item.icon.viewBox" fill="none" stroke="currentColor" stroke-width="2">
            <path :d="item.icon.path"/>
          </svg>
          <span>{{ item.label }}</span>
        </button>
      </nav>
    </aside>

    <main class="main-content">
      <header class="page-header">
        <div class="header-left">
          <h1>工作流管理</h1>
          <p class="subtitle">管理所有工作流，查看详情和操作历史</p>
        </div>
        <button class="refresh-btn" @click="loadWorkflows">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          刷新
        </button>
      </header>

      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-value">{{ workflows.length }}</span>
          <span class="stat-label">总工作流</span>
        </div>
        <div class="stat-item processing">
          <span class="stat-value">{{ processingCount }}</span>
          <span class="stat-label">处理中</span>
        </div>
        <div class="stat-item completed">
          <span class="stat-value">{{ completedCount }}</span>
          <span class="stat-label">已完成</span>
        </div>
      </div>

      <div v-if="isLoading" class="loading-spinner">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="workflows.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.05 11a3 3 0 1 1 5.9 0"/>
          <path d="M15 11h.01"/>
        </svg>
        <p>暂无工作流</p>
        <button class="create-btn" @click="navigateTo('/upload')">新建工作流</button>
      </div>

      <div v-else class="workflows-grid">
        <div
          v-for="workflow in workflows"
          :key="workflow.workflowId"
          class="workflow-card"
          :class="workflow.status"
        >
          <div class="card-header">
            <div class="file-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div class="file-info">
              <h3>{{ workflow.fileName }}</h3>
              <span class="workflow-id">{{ workflow.workflowId }}</span>
            </div>
            <span class="status-badge" :class="workflow.status">
              {{workflow.status}}
            </span>
          </div>

          <div class="card-body">
            <div class="meta-row">
              <span class="meta-label">规则总数</span>
              <span class="meta-value">{{ workflow.rulesTotal }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">已通过</span>
              <span class="meta-value approved">{{ workflow.rulesApproved }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">创建时间</span>
              <span class="meta-value">{{ formatTime(workflow.createTime) }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">更新时间</span>
              <span class="meta-value">{{ formatTime(workflow.updateTime) }}</span>
            </div>
          </div>

          <div class="card-footer">
            <button class="action-btn view" @click="viewWorkflow(workflow.workflowId)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              详情
            </button>
            <button class="action-btn rules" @click="viewRules(workflow.workflowId)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              规则
            </button>
            <button
              v-if="['pending','generating' ,'generated'].includes(workflow.status)"
              class="action-btn continue"
              @click="continueWorkflow(workflow)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 19V5"/>
                <path d="M5 12l7-7 7 7"/>
              </svg>
              继续
            </button>
            <button
              v-if="workflow.status !== 'completed'&&workflow.status !== 'cancelled'"
              class="action-btn end"
              @click="endWorkflowById(workflow.workflowId)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <path d="M9 9h6"/>
                <path d="M9 15h6"/>
              </svg>
              结束
            </button>
          </div>
        </div>
      </div>

      <div v-if="workflows.length > 0" class="pagination">
        <button
          :disabled="currentPage <= 1"
          @click="currentPage--"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      <div v-if="showWorkflowModal" class="modal-overlay" @click="showWorkflowModal = false">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>工作流详情</h3>
            <button @click="showWorkflowModal = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div v-if="selectedWorkflow" class="modal-body">
            <div class="detail-row">
              <span class="detail-label">工作流ID</span>
              <span class="detail-value">{{ selectedWorkflow.workflowId }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">文件名</span>
              <span class="detail-value">{{ selectedWorkflow.fileName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">状态</span>
              <span class="detail-value">
                <span class="status-badge" :class="selectedWorkflow.status">
                  {{ selectedWorkflow.status }}
                </span>
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">规则总数</span>
              <span class="detail-value">{{ selectedWorkflow.rulesTotal }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">已通过规则</span>
              <span class="detail-value">{{ selectedWorkflow.rulesApproved }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">创建时间</span>
              <span class="detail-value">{{ selectedWorkflow.createTime }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">更新时间</span>
              <span class="detail-value">{{ selectedWorkflow.updateTime }}</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="showWorkflowModal = false">关闭</button>
            <button class="btn-primary" @click="selectedWorkflow&&viewRules(selectedWorkflow?.workflowId)">查看规则</button>
          </div>
        </div>
      </div>

      <div v-if="errorMessage" class="error-toast">
        {{ errorMessage }}
        <button @click="errorMessage = ''">×</button>
      </div>

      <!-- 错误提示图标（最小化状态） -->
      <button 
        v-if="showErrorAlert && errorIsMinimized" 
        class="error-mini-icon"
        @click="toggleErrorAlert"
        title="点击查看错误信息"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12" y2="16"/>
        </svg>
      </button>

      <!-- 规则生成失败提示弹窗 -->
      <div v-if="showErrorAlert && !errorIsMinimized" class="modal-overlay error-overlay">
        <div class="modal error-alert-modal" @click.stop>
          <div class="modal-header error-header">
            <div class="error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12" y2="16"/>
              </svg>
            </div>
            <h3>工作流执行出错</h3>
            <div class="header-actions">
              <button class="minimize-btn" @click.stop="toggleErrorAlert" title="最小化">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="4 14 12 14 12 20"/>
                  <polyline points="20 10 12 10 12 4"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="modal-body error-body" v-if="errorData">
            <p>工作流执行过程中过程中发生错误，点击弹窗右上角最小化</p>
            <div class="error-details">
              <div class="error-row">
                <span class="error-label">错误工作流</span>
                <span class="error-value">{{ errorData.workflowId }}</span>
              </div>
              <div class="error-row">
                <span class="error-label">错误类型</span>
                <span class="error-value">{{ errorData.errorType }}</span>
              </div>
              <div class="error-row">
                <span class="error-label">错误时间</span>
                <span class="error-value">{{ formatTime(errorData.time) }}</span>
              </div>
              <div class="error-row full-width">
                <span class="error-label">错误信息</span>
                <span class="error-value">{{ errorData.errorMessage }}</span>
              </div>
            </div>
          </div>
<!--          <div class="modal-footer">-->
<!--            <button class="btn-primary" @click="viewErrorWorkflow">查看详情</button>-->
<!--          </div>-->
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * 工作流管理组件
 * 功能：管理所有工作流，支持查看详情、查看规则、继续工作流、结束工作流等操作
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getWorkflows, getWorkflow, getWorkflowError, endWorkflow } from '@/utils/api'
import { useWorkflowStore } from '@/stores/workflow'
import type { Workflow, ErrorMessage } from '@/types'

// 获取路由实例
const router = useRouter()
const route = useRoute()

// 获取状态管理store
const store = useWorkflowStore()
if(!store.currentWorkflowId.value){
  const store_id=sessionStorage.getItem('currentWorkflowId')
  if(store_id){
    console.log('store_id',store_id)
    store.setCurrentWorkflowId(store_id)
  }
}
// 响应式状态变量
const currentPath = ref(route.path)          // 当前路由路径
const workflows = ref<Workflow[]>([])         // 工作流列表
const selectedWorkflow = ref<Workflow | null>(null) // 当前选中的工作流详情
const isLoading = ref(false)                  // 是否正在加载
const currentPage = ref(1)                    // 当前页码
const totalPages = ref(1)                     // 总页数
const errorMessage = ref('')                  // 错误提示消息
const showWorkflowModal = ref(false)          // 是否显示工作流详情弹窗
const showErrorAlert = ref(false)             // 是否显示规则生成失败提示弹窗
const errorIsMinimized = ref(false)           // 错误弹窗是否最小化
const errorWorkflowId = ref('')               // 出错的工作流ID
const errorData = ref<ErrorMessage | null>(null) // 从API获取的错误信息

// 导航菜单配置
const navItems = [
  { path: '/', label: '首页', icon: { viewBox: '0 0 24 24', path: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z' } },
  { path: '/upload', label: '新建任务', icon: { viewBox: '0 0 24 24', path: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' } },
  { path: '/workflows', label: '工作流管理', icon: { viewBox: '0 0 24 24', path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' } },
  { path: `/rules/${store.currentWorkflowId.value}`, label: '规则列表', icon: { viewBox: '0 0 24 24', path: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' } },
  { path: `/test/${store.currentWorkflowId.value}`, label: '测试结果', icon: { viewBox: '0 0 24 24', path: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' } }
]

/**
 * 计算属性：处理中工作流数量
 */
const processingCount = computed(() => 
  workflows.value.filter(w => !['completed', 'cancelled', 'failed'].includes(w.status)).length
)

/**
 * 计算属性：已完成工作流数量
 */
const completedCount = computed(() =>
    workflows.value.filter(w => ['completed', 'cancelled', 'failed'].includes(w.status)).length
)

/**
 * 导航跳转方法
 * @param path 目标路由路径
 */
function navigateTo(path: string): void {
  currentPath.value = path
  router.push(path)
}

/**
 * 获取工作流状态标签文本
 * @param status 工作流状态
 * @returns 状态显示文本
 */
// function getStatusLabel(status: string): string {
//   const labels: Record<string, string> = {
//     uploading: '上传中',
//     generating: '生成中',
//     testing: '测试中',
//     completed: '已完成'
//   }
//   return labels[status] || status
// }

/**
 * 格式化时间字符串
 * @param timeString 时间字符串
 * @returns 本地化时间显示
 */
function formatTime(timeString: string): string {
  const date = new Date(timeString)
  return date.toLocaleString('zh-CN')
}

/**
 * 加载工作流列表
 */
async function loadWorkflows(): Promise<void> {
  isLoading.value = true
  try {
    const response = await getWorkflows(currentPage.value, 10)
    if (response.code === 200) {
      workflows.value = response.data.list
      totalPages.value = Math.ceil(response.data.total / 10)
      
      // 检查是否有工作流存在错误信息
      await checkForWorkflowErrors()
    }
  } catch (error) {
    errorMessage.value = '加载工作流列表失败'
    console.error('Load workflows error:', error)
  } finally {
    isLoading.value = false
  }
}

/**
 * 检查工作流是否有错误信息
 */
async function checkForWorkflowErrors(): Promise<void> {
  // 获取当前工作流ID
  const currentWfId = store.getCurrentWorkflowId()
  console.log("currentWorkFlowId",currentWfId)
  
  // 如果没有当前工作流，不检查
  if (!currentWfId) return
  
  // 查找当前工作流
  const currentWorkflow = workflows.value.find(w => w.workflowId === currentWfId)
  
  // 如果找到工作流，调用API获取错误信息
  if (currentWorkflow) {
    try {
      const response = await getWorkflowError(currentWfId)
      if (response.code === 200 && response.data&&currentWorkflow.status==="failed") {
        errorWorkflowId.value = response.data.workflowId
        errorData.value = response.data
        showErrorAlert.value = true
        errorIsMinimized.value = false
      }
    } catch (error) {
      // 如果API调用失败（可能没有错误信息），不显示弹窗
      console.log('No error message found for workflow:', currentWfId)
    }
  }
}

/**
 * 切换错误弹窗的最小化/展开状态
 */
function toggleErrorAlert(): void {
  errorIsMinimized.value = !errorIsMinimized.value
}

/**
 * 查看工作流详情
 * @param workflowId 工作流ID
 */
async function viewWorkflow(workflowId: string): Promise<void> {
  try {
    const response = await getWorkflow(workflowId)
    if (response.code === 200) {
      selectedWorkflow.value = response.data
      showWorkflowModal.value = true
    }
  } catch (error) {
    errorMessage.value = '加载工作流详情失败'
    console.error('Get workflow error:', error)
  }
}

/**
 * 查看错误工作流详情
 */
// function viewErrorWorkflow(): void {
//   showErrorAlert.value = false
//   if (errorWorkflowId.value) {
//     viewWorkflow(errorWorkflowId.value)
//   }
// }

/**
 * 跳转到规则列表页面并携带工作流ID
 * @param workflowId 工作流ID
 */
function viewRules(workflowId: string): void {
  //sessionStorage.setItem('selectedWorkflowId', workflowId)
  router.push(`/rules/${workflowId}`)
}

/**
 * 继续工作流
 * 根据工作流状态跳转到对应的界面继续执行
 * 
 * 说明：
 * - 继续运行中的工作流时，更新全局 currentWorkflowId
 * - selectedWorkflowId 用于页面初始化时恢复用户选择
 * @param workflow 工作流对象
 */
async function continueWorkflow(workflow: Workflow): Promise<void> {
  // 保存工作流ID到sessionStorage（供目标页面初始化使用）
  //sessionStorage.setItem('selectedWorkflowId', workflow.workflowId)
  
  try {
    const response = await getWorkflow(workflow.workflowId)
    if (response.code === 200) {
      const currentStatus = response.data.status
      // 根据状态跳转到对应的路由
      const targetRoute = store.getRouteByStatus(currentStatus)
      
      // 设置当前工作流状态（仅运行中的工作流）
      if (['pending' ,'analyzing','analyzed', 'generating' ,'generated',
        'loading','loaded','replaying','replayed','verifying'].includes(currentStatus)) {
        store.setCurrentWorkflow(response.data)
        store.setCurrentWorkflowId(response.data.workflowId)
      }
      
      // 跳转到对应页面
      await router.push(targetRoute)
    }
  } catch (error) {
    errorMessage.value = '获取工作流详情失败'
    console.error('Continue workflow error:', error)
  }
}

/**
 * 结束工作流
 * @param workflowId 工作流ID
 */
async function endWorkflowById(workflowId: string): Promise<void> {
  if (!confirm('确定要结束此工作流吗？')) return
  try {
    const response = await endWorkflow(workflowId)
    if (response.code === 200) {
      errorMessage.value = '工作流已结束'
      loadWorkflows()
    }
  } catch (error) {
    errorMessage.value = '结束工作流失败'
    console.error('End workflow error:', error)
  }
}

/**
 * 组件挂载时执行
 */
onMounted(() => {
  loadWorkflows()
})
</script>

<style lang="scss" scoped>
.workflow-list-container {
  display: flex;
  min-height: 100vh;
  background: #f5f7fa;
}

.sidebar {
  width: 200px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  padding: 20px 0;
  flex-shrink: 0;
}

.logo-section {
  display: flex;
  align-items: center;
  padding: 0 20px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 20px;

  .logo {
    width: 36px;
    height: 36px;
    color: #667eea;
    margin-right: 12px;

    svg {
      width: 100%;
      height: 100%;
    }
  }

  .logo-text {
    font-size: 16px;
    font-weight: 600;
  }
}

.nav-menu {
  padding: 0 12px;

  button {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 12px 16px;
    margin-bottom: 4px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;

    svg {
      width: 18px;
      height: 18px;
      margin-right: 12px;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    &.active {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }
  }
}

.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .header-left {
    h1 {
      font-size: 24px;
      color: #333;
      margin-bottom: 4px;
    }

    .subtitle {
      font-size: 14px;
      color: #666;
    }
  }

  .refresh-btn {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: white;
    color: #666;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;

    svg {
      width: 16px;
      height: 16px;
      margin-right: 6px;
    }

    &:hover {
      border-color: #667eea;
      color: #667eea;
    }
  }
}

.stats-bar {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;

  .stat-item {
    flex: 1;
    background: white;
    padding: 20px;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    .stat-value {
      display: block;
      font-size: 28px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
    }

    &.processing .stat-value { color: #fa8c16; }
    &.completed .stat-value { color: #52c41a; }
  }
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  p {
    color: #666;
    font-size: 14px;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;

  svg {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
  }

  p {
    font-size: 16px;
    margin-bottom: 16px;
  }

  .create-btn {
    padding: 10px 24px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
  }
}

.workflows-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.workflow-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-top: 4px solid #ddd;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  &.uploading { border-top-color: #1890ff; }
  &.generating { border-top-color: #fa8c16; }
  &.testing { border-top-color: #52c41a; }
  &.completed { border-top-color: #722ed1; }

  .card-header {
    display: flex;
    align-items: center;
    padding: 16px;
    gap: 12px;
    border-bottom: 1px solid #f0f0f0;

    .file-icon {
      width: 40px;
      height: 40px;
      background: #f0f5ff;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #667eea;
      flex-shrink: 0;

      svg {
        width: 20px;
        height: 20px;
      }
    }

    .file-info {
      flex: 1;
      min-width: 0;

      h3 {
        font-size: 15px;
        color: #333;
        margin-bottom: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .workflow-id {
        font-size: 11px;
        color: #999;
        font-family: monospace;
      }
    }

    .status-badge {
      padding: 4px 10px;
      border-radius: 10px;
      font-size: 11px;

      &.uploading {
        background: #e6f7ff;
        color: #1890ff;
      }
      &.generating {
        background: #fff7e6;
        color: #fa8c16;
      }
      &.testing {
        background: #f6ffed;
        color: #52c41a;
      }
      &.completed {
        background: #f5f0ff;
        color: #722ed1;
      }
    }
  }

  .card-body {
    padding: 16px;

    .meta-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f8f9fa;

      &:last-child {
        border-bottom: none;
      }

      .meta-label {
        font-size: 13px;
        color: #999;
      }

      .meta-value {
        font-size: 13px;
        color: #333;
        font-weight: 500;

        &.approved {
          color: #52c41a;
        }
      }
    }
  }

  .card-footer {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    background: #fafafa;

    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;

      svg {
        width: 14px;
        height: 14px;
        margin-right: 4px;
      }

      &.view {
        background: #e6f7ff;
        color: #1890ff;

        &:hover {
          background: #bae7ff;
        }
      }

      &.rules {
        background: #f6ffed;
        color: #52c41a;

        &:hover {
          background: #d9f7be;
        }
      }

      &.continue {
        background: #e6f7ff;
        color: #1890ff;

        &:hover {
          background: #bae7ff;
        }
      }

      &.end {
        background: #fff2f0;
        color: #ff4d4f;

        &:hover {
          background: #ffccc7;
        }
      }
    }
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;

  button {
    width: 36px;
    height: 36px;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 16px;
      height: 16px;
      color: #666;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      border-color: #667eea;
      color: #667eea;
    }
  }

  span {
    font-size: 14px;
    color: #666;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 450px;
  overflow: hidden;

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #eee;

    h3 {
      font-size: 16px;
      color: #333;
    }

    button {
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      color: #999;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        width: 18px;
        height: 18px;
      }
    }
  }

  .modal-body {
    padding: 24px;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .detail-label {
      font-size: 14px;
      color: #666;
    }

    .detail-value {
      font-size: 14px;
      color: #333;
      font-weight: 500;

      &.error {
        color: #e74c3c;
        word-break: break-all;
        max-width: 400px;
      }
    }

    &.error-row {
      background: #fef5f5;
      padding: 12px;
      margin: 8px 0;
      border-radius: 8px;
      border-left: 4px solid #e74c3c;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid #eee;

    .btn-secondary {
      padding: 8px 20px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background: white;
      color: #666;
      font-size: 14px;
      cursor: pointer;

      &:hover {
        background: #f5f7fa;
      }
    }

    .btn-primary {
      padding: 8px 20px;
      border: none;
      border-radius: 6px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      font-size: 14px;
      cursor: pointer;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }
    }
  }
}

.error-mini-icon {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: #ff4d4f;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.4);
  z-index: 1000;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(255, 77, 79, 0.5);
  }

  svg {
    width: 22px;
    height: 22px;
  }
}

.error-overlay {
  z-index: 999;
}

.error-alert-modal {
  .error-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    background: linear-gradient(135deg, #fff5f5, #fff0f0);
    border-bottom: 1px solid #ffccc7;

    .error-icon {
      width: 40px;
      height: 40px;
      background: #ff4d4f;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      margin-right: 12px;

      svg {
        width: 20px;
        height: 20px;
      }
    }

    h3 {
      flex: 1;
      font-size: 16px;
      color: #d93026;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 8px;

      .minimize-btn {
        width: 28px;
        height: 28px;
        border: none;
        background: transparent;
        color: #999;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background 0.2s;

        &:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #666;
        }

        svg {
          width: 16px;
          height: 16px;
        }
      }
    }
  }

  .error-body {
    padding: 24px;

    p {
      font-size: 14px;
      color: #666;
      line-height: 1.6;
      margin: 0 0 16px 0;
    }

    .error-details {
      background: #fff5f5;
      border-radius: 8px;
      padding: 16px;

      .error-row {
        display: flex;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        &.full-width {
          flex-direction: column;

          .error-value {
            margin-top: 8px;
            word-break: break-all;
          }
        }

        .error-label {
          font-size: 13px;
          color: #999;
          min-width: 80px;
          flex-shrink: 0;
        }

        .error-value {
          font-size: 14px;
          color: #d93026;
          font-weight: 500;
        }
      }
    }

    .error-preview {
      background: #fff5f5;
      padding: 12px;
      border-radius: 6px;
      border-left: 4px solid #ff4d4f;
      color: #d93026;
      font-size: 13px;
      word-break: break-all;
      margin: 0;
    }
  }
}

.error-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #ff4d4f;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 12px;

  button {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 60px;

    .logo-text {
      display: none;
    }

    .nav-menu button span {
      display: none;
    }
  }

  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
  }

  .workflows-grid {
    grid-template-columns: 1fr;
  }
}
</style>