<template>
  <div class="rule-list-container">
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
          <h1>规则审查</h1>
          <p class="subheader">审核生成的规则，选择通过的规则进行测试</p>
        </div>
        <div class="workflow-selector">
          <span>选择工作流:</span>
          <select v-model="displayWorkflowId" @change="onWorkflowChange">
            <option value="">请选择工作流</option>
            <option v-for="wf in workflows" :key="wf.workflowId" :value="wf.workflowId">
              {{ wf.fileName }}
            </option>
          </select>
        </div>
      </header>

      <div v-if="!displayWorkflowId" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.05 11a3 3 0 1 1 5.9 0"/>
          <path d="M15 11h.01"/>
        </svg>
        <p>请先选择一个工作流</p>
        <button class="create-btn" @click="navigateTo('/upload')">新建工作流</button>
      </div>

      <template v-else>
        <div class="stats-bar">
          <div class="stat-item">
            <span class="stat-value">{{ rules.length }}</span>
            <span class="stat-label">总数</span>
          </div>
          <div class="stat-item pending">
            <span class="stat-value">{{ pendingRules.length }}</span>
            <span class="stat-label">待审核</span>
          </div>
          <div class="stat-item approved">
            <span class="stat-value">{{ approvedRules.length }}</span>
            <span class="stat-label">已通过</span>
          </div>
        </div>

        <div class="filter-bar">
          <div class="filter-tabs">
            <button
              v-for="tab in filterTabs"
              :key="tab.value"
              :class="{ active: currentFilter === tab.value }"
              @click="currentFilter = tab.value"
            >
              {{ tab.label }}
            </button>
          </div>
          <div class="action-buttons">
            <button
              class="batch-approve-btn"
              :disabled="selectedRules.length === 0"
              @click="batchApproveSelected"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              批量通过
            </button>
            
            
            <button
              class="test-btn"
              :disabled="approvedRules.length === 0"
              @click="handleStartTest"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              开始测试
            </button>
          </div>
        </div>

        <div class="rules-list">
          <div
            v-for="rule in filteredRules"
            :key="rule.id"
            class="rule-card"
            :class="rule.status"
          >
            <div class="rule-header">
              <input
                type="checkbox"
                :checked="selectedRules.includes(rule.id)"
                @change="toggleSelectRule(rule.id)"
                class="rule-checkbox"
              />
              <span class="rule-id">{{ rule.id }}</span>
              <span class="status-badge" :class="rule.status">
                {{ getStatusLabel(rule.status) }}
              </span>
            </div>
            <pre class="rule-content">{{ rule.content }}</pre>
            <div class="rule-meta">
              <span class="protocol">{{ rule.protocol }}</span>
              <span class="target-packet">{{ rule.targetPacket }}</span>
            </div>
            <div class="rule-actions">
              <button
                class="action-btn edit"
                @click="openEditModal(rule)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                class="action-btn approve"
                v-if="rule.status === 'pending'"
                @click="approveRule(rule.id)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
              <button
                class="action-btn regenerate"
                @click="openRegenerateModal(rule.id)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div v-if="filteredRules.length === 0" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.05 11a3 3 0 1 1 5.9 0"/>
            <path d="M15 11h.01"/>
          </svg>
          <p>暂无规则</p>
        </div>
      </template>

      <div v-if="isEditing" class="modal-overlay" @click="closeModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>编辑规则</h3>
            <button class="close-btn" @click="closeModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <textarea
              v-model="editingContent"
              class="rule-textarea"
              rows="8"
              placeholder="请输入规则内容..."
            ></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeModal">取消</button>
            <button class="btn-save" @click="saveEdit">保存</button>
          </div>
        </div>
      </div>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
        <button class="close-error" @click="errorMessage = ''">×</button>
      </div>

      <div v-if="showTestProgress" class="test-progress-overlay">
        <div class="test-progress-card">
          <h3>规则测试进度</h3>
          <div class="progress-bar-container">
            <div class="progress-bar" :style="{ width: testProgress + '%' }"></div>
          </div>
          <span class="progress-text">{{ testProgress }}%</span>
          <span class="phase-text">当前阶段: {{ currentTestPhaseLabel }}</span>
        </div>
      </div>

      <!-- 重新生成规则弹窗 -->
      <div v-if="showRegenerateModal" class="modal-overlay" @click="closeRegenerateModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>重新生成规则</h3>
            <button class="close-btn" @click="closeRegenerateModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <p>请输入您对规则重新生成的建议，系统会根据您的建议重新生成规则。</p>
            <textarea
              v-model="regenerateSuggestion"
              class="suggestion-input"
              placeholder="例如：请优化规则的匹配条件，使其更加精确..."
              rows="4"
            ></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeRegenerateModal">取消</button>
            <button class="btn-primary" @click="confirmRegenerate">确认重新生成</button>
          </div>
        </div>
      </div>

      <div v-if="showRegenerationProgress" class="regeneration-progress-overlay">
        <div class="regeneration-progress-card">
          <div class="progress-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </div>
          <h3>规则重新生成中</h3>
          <div class="progress-bar-container">
            <div class="progress-bar generation" :style="{ width: ruleGenerationProgress + '%' }"></div>
          </div>
          <div class="progress-info">
            <span class="progress-percentage">{{ ruleGenerationProgress }}%</span>
            <span class="progress-message">{{ generationMessage || '正在准备...' }}</span>
          </div>
          <div class="rules-count">
            <span class="count-label">已生成</span>
            <span class="count-value">{{ rulesGenerated }}</span>
            <span class="count-divider">/</span>
            <span class="count-total">{{ regeneratingRuleCount }}</span>
            <span class="count-unit">条规则</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * 规则列表组件
 * 功能：展示和管理检测规则，支持规则审核、编辑、重新生成和测试启动
 * 说明：规则状态由后端管理，所有审核操作通过API接口实现；测试进度通过store共享状态
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getRules, updateRule, regenerateRule, startTest, getWorkflows, batchApproveRules } from '@/utils/api'
import { useWorkflowStore } from '@/stores/workflow'
import type { Rule, Workflow } from '@/types'

// 获取路由实例和状态管理store
const router = useRouter()
const route = useRoute()
const store = useWorkflowStore()

// 当前路由路径，用于高亮导航菜单
const currentPath = ref(route.path)

// 导航菜单配置
const navItems = [
  { path: '/', label: '首页', icon: { viewBox: '0 0 24 24', path: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z' } },
  { path: '/upload', label: '新建任务', icon: { viewBox: '0 0 24 24', path: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' } },
  { path: '/workflows', label: '工作流管理', icon: { viewBox: '0 0 24 24', path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' } },
  { path: '/rules', label: '规则列表', icon: { viewBox: '0 0 24 24', path: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' } },
  { path: '/test', label: '测试结果', icon: { viewBox: '0 0 24 24', path: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' } }
]

// 响应式状态变量
const workflows = ref<Workflow[]>([])           // 工作流列表
const displayWorkflowId = ref('')               // 当前页面显示的工作流ID（区别于store中的currentWorkflowId）
const rules = ref<Rule[]>([])                   // 规则列表
const currentFilter = ref('all')                // 当前筛选条件
const selectedRules = ref<string[]>([])          // 选中的规则ID列表
const isEditing = ref(false)                    // 是否正在编辑规则
const editingRule = ref<Rule | null>(null)       // 当前编辑的规则
const editingContent = ref('')                  // 编辑内容
const errorMessage = ref('')                    // 错误提示消息
const showTestProgress = ref(false)             // 是否显示测试进度弹窗
const showRegenerationProgress = ref(false)     // 是否显示规则重新生成进度弹窗
const regeneratingRuleCount = ref(0)            // 当前重新生成的规则数量
const showRegenerateModal = ref(false)          // 是否显示重新生成规则弹窗
const regeneratingRuleId = ref('')              // 当前正在重新生成的规则ID
const regenerateSuggestion = ref('')            // 用户建议，用于指导规则重新生成

// 测试进度相关状态（从store获取）
const testProgress = computed(() => store.testProgress.value)
const currentTestPhase = computed(() => store.currentTestPhase.value)

// 规则生成进度相关状态（从store获取）
const ruleGenerationProgress = computed(() => store.ruleGenerationProgress.value)
const generationMessage = computed(() => store.generationMessage.value)
const rulesGenerated = computed(() => store.rulesGenerated.value)

// 测试阶段中文映射（与API文档一致）
const phaseLabels: Record<string, string> = {
  loading: '规则加载',
  replay: '报文回放',
  testing: '命中验证'
}

// 当前测试阶段的中文显示
const currentTestPhaseLabel = computed(() => {
  return phaseLabels[currentTestPhase.value] || currentTestPhase.value
})

// 筛选标签配置
const filterTabs = [
  { label: '全部', value: 'all' },
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' }
]

/**
 * 计算属性：根据筛选条件过滤规则
 */
const filteredRules = computed(() => {
  if (currentFilter.value === 'all') return rules.value
  return rules.value.filter(r => r.status === currentFilter.value)
})

/**
 * 计算属性：待审核规则数量
 */
const pendingRules = computed(() => rules.value.filter(r => r.status === 'pending'))

/**
 * 计算属性：已通过规则数量
 */
const approvedRules = computed(() => rules.value.filter(r => r.status === 'approved'))

/**
 * 导航跳转方法
 * @param path 目标路由路径
 */
function navigateTo(path: string): void {
  currentPath.value = path
  router.push(path)
}

/**
 * 获取状态标签文本
 * @param status 规则状态
 * @returns 状态显示文本
 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '待审核',
    approved: '已通过'
  }
  return labels[status] || status
}

/**
 * 切换规则选中状态
 * @param ruleId 规则ID
 */
function toggleSelectRule(ruleId: string): void {
  const index = selectedRules.value.indexOf(ruleId)
  if (index === -1) {
    selectedRules.value.push(ruleId)
  } else {
    selectedRules.value.splice(index, 1)
  }
}

/**
 * 审核通过规则（使用批量接口）
 * @param ruleId 规则ID
 */
async function approveRule(ruleId: string): Promise<void> {
  try {
    const response = await batchApproveRules([ruleId])
    if (response.code === 200) {
      response.data.rules.forEach(updatedRule => {
        const rule = rules.value.find(r => r.id === updatedRule.id)
        if (rule) rule.status = updatedRule.status
      })
    } else {
      errorMessage.value = response.message || '审核通过失败'
    }
  } catch (error) {
    errorMessage.value = '审核通过失败，请检查网络连接'
    console.error('Approve rule error:', error)
  }
}

/**
 * 批量审核通过选中的规则
 */
async function batchApproveSelected(): Promise<void> {
  if (selectedRules.value.length === 0) {
    errorMessage.value = '请先选择要审核的规则'
    return
  }

  try {
    const response = await batchApproveRules(selectedRules.value)
    if (response.code === 200) {
      response.data.rules.forEach(updatedRule => {
        const rule = rules.value.find(r => r.id === updatedRule.id)
        if (rule) rule.status = updatedRule.status
      })
      selectedRules.value = []
    } else {
      errorMessage.value = response.message || '批量审核通过失败'
    }
  } catch (error) {
    errorMessage.value = '批量审核通过失败，请检查网络连接'
    console.error('Batch approve error:', error)
  }
}

/**
 * 打开编辑规则弹窗
 * @param rule 要编辑的规则
 */
function openEditModal(rule: Rule): void {
  editingRule.value = rule
  editingContent.value = rule.content
  isEditing.value = true
}

/**
 * 关闭编辑弹窗
 */
function closeModal(): void {
  isEditing.value = false
  editingRule.value = null
  editingContent.value = ''
}

/**
 * 保存编辑的规则
 */
async function saveEdit(): Promise<void> {
  if (!editingRule.value || !editingContent.value.trim()) {
    errorMessage.value = '规则内容不能为空'
    return
  }

  try {
    const response = await updateRule(editingRule.value.id, editingContent.value)
    if (response.code === 200) {
      const rule = rules.value.find(r => r.id === editingRule.value?.id)
      if (rule) rule.content = editingContent.value
      closeModal()
    } else {
      errorMessage.value = response.message || '更新规则失败'
    }
  } catch (error) {
    errorMessage.value = '更新规则失败，请检查网络连接'
    console.error('Update rule error:', error)
  }
}

/**
 * 重新生成单个规则
 * @param ruleId 规则ID
 * @param suggestion 用户建议，用于指导规则重新生成
 */
async function regenerateSingleRule(ruleId: string, suggestion?: string): Promise<void> {
  try {
    // 重置进度状态，避免显示上一次的进度值
    store.setRuleGenerationProgress(0)
    store.setRulesGenerated(0)
    store.setGenerationMessage('')
    
    regeneratingRuleCount.value = 1
    showRegenerationProgress.value = true
    
    const response = await regenerateRule(ruleId, suggestion)
    if (response.code === 200) {
      // // 重置规则状态为待审核，等待WebSocket消息更新内容
      // const rule = rules.value.find(r => r.id === ruleId)
      // // if (rule) {
      // //   rule.status = 'pending'
      // // }
    }
  } catch (error) {
    showRegenerationProgress.value = false
    errorMessage.value = '重新生成规则失败'
    console.error('Regenerate rule error:', error)
  }
}

/**
 * 打开重新生成规则弹窗
 * @param ruleId 规则ID
 */
function openRegenerateModal(ruleId: string): void {
  regeneratingRuleId.value = ruleId
  regenerateSuggestion.value = ''
  showRegenerateModal.value = true
}

/**
 * 关闭重新生成规则弹窗
 */
function closeRegenerateModal(): void {
  showRegenerateModal.value = false
  regeneratingRuleId.value = ''
  regenerateSuggestion.value = ''
}

/**
 * 确认重新生成规则
 */
function confirmRegenerate(): void {
  if (!regeneratingRuleId.value) return
  
  regenerateSingleRule(regeneratingRuleId.value, regenerateSuggestion.value)
  closeRegenerateModal()
}

/**
 * 启动测试
 * 说明：测试进度通过store共享状态和WebSocket连接监听（消息处理在websocket.ts中）
 */
async function handleStartTest(): Promise<void> {
  // 重置测试状态
  store.setTestProgress(0)
  store.setCurrentTestPhase('')

  try {
    const response = await startTest(displayWorkflowId.value)
    if (response.code === 200) {
      showTestProgress.value = true
    } else {
      errorMessage.value = response.message || '启动测试失败'
    }
  } catch (error) {
    errorMessage.value = '启动测试失败，请检查网络连接'
    console.error('Start test error:', error)
  }
}

/**
 * 加载规则列表
 */
async function loadRules(): Promise<void> {
  if (!displayWorkflowId.value) return
  try {
    const response = await getRules(displayWorkflowId.value)
    if (response.code === 200) {
      rules.value = response.data.list
    }
  } catch (error) {
    errorMessage.value = '加载规则失败，请检查网络连接'
    console.error('Load rules error:', error)
  }
}

/**
 * 加载工作流列表
 */
async function loadWorkflows(): Promise<void> {
  try {
    const response = await getWorkflows(1, 50)
    if (response.code === 200) {
      workflows.value = response.data.list
    }
  } catch (error) {
    console.error('Load workflows error:', error)
  }
}

/**
 * 工作流切换处理
 */
async function onWorkflowChange(): Promise<void> {
  rules.value = []
  await loadRules()
  if(displayWorkflowId.value){
    router.push(`/rules/${displayWorkflowId.value}`)
  }
}

/**
 * 组件挂载时执行（实现可重入性）
 * 
 * 说明：
 * - displayWorkflowId：当前页面显示的工作流（可能是历史工作流）
 * - store.currentWorkflowId：当前运行中的工作流
 * - 页面初始化优先显示当前运行中的工作流的规则
 */
async function initOnMounted(): Promise<void> {
  // 记录最后成功步骤为 rules
  store.setLastStep('rules')
  
  store.setNavigationCallback((path: string) => {
    router.push(path)
  })
  
  // 注册规则生成完成回调（WebSocket直接调用）
  store.setRuleGenerationCompleteCallback(handleRuleGenerationComplete)
  // 注册规则生成失败回调（WebSocket直接调用）
  //store.setRuleGenerationFailedCallback(handleRuleGenerationFailed)
  
  await loadWorkflows()
  showRegenerationProgress.value = false
  regeneratingRuleCount.value = 0
  
  // const currentWfId = store.currentWorkflowId.value
  // if (currentWfId) {
  //   const workflow = workflows.value.find(w => w.workflowId === currentWfId)
  //   if (workflow) {
  //     displayWorkflowId.value = currentWfId
  //     loadRules()
  //   }
  // }
  const routeWorkflowId = route.params.workflowId as string
  if(routeWorkflowId){
    displayWorkflowId.value=routeWorkflowId
  }
  await loadRules()
}

/**
 * 规则生成完成处理函数（由 WebSocket 直接调用）
 */
function handleRuleGenerationComplete(): void {
  showRegenerationProgress.value = false
  regeneratingRuleCount.value = 0
  loadRules()
}

/**
 * 规则生成失败处理函数（由 WebSocket 直接调用）
 */
// function handleRuleGenerationFailed(errorMessage: string): void {
//   showRegenerationProgress.value = false
//   regeneratingRuleCount.value = 0
//   console.error('Rule generation failed:', errorMessage)
// }

/**
 * 监听规则刷新标志，关闭进度弹窗并刷新规则列表（备用方案）
 */
watch(() => store.rulesNeedRefresh.value, (needRefresh) => {
  if (needRefresh) {
    showRegenerationProgress.value = false
    regeneratingRuleCount.value = 0
    store.setRulesNeedRefresh(false)
    loadRules()
  }
})
watch(() => route.params.workflowId, (newWorkflowId:any) => {
  if (newWorkflowId && newWorkflowId !== displayWorkflowId.value) {
    displayWorkflowId.value = newWorkflowId as string
    loadRules()
  }
})

/**
 * 组件挂载时执行
 */
onMounted(() => {
  initOnMounted()
})
</script>

<style lang="scss" scoped>
.rule-list-container {
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

    .subheader {
      font-size: 14px;
      color: #666;
    }
  }

  .workflow-selector {
    display: flex;
    align-items: center;
    gap: 12px;

    span {
      font-size: 14px;
      color: #666;
    }

    select {
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      background: white;
      cursor: pointer;

      &:focus {
        outline: none;
        border-color: #667eea;
      }
    }
  }
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

.stats-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;

  .stat-item {
    flex: 1;
    background: white;
    padding: 16px;
    border-radius: 10px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    .stat-value {
      display: block;
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 13px;
      color: #666;
    }

    &.pending .stat-value { color: #faad14; }
    &.approved .stat-value { color: #52c41a; }
  }
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .filter-tabs {
    display: flex;
    gap: 8px;

    button {
      padding: 8px 20px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background: white;
      color: #666;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;

      &.active {
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-color: #667eea;
        color: white;
      }

      &:hover:not(.active) {
        border-color: #667eea;
        color: #667eea;
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: 12px;

    button {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;

      svg {
        width: 14px;
        height: 14px;
        margin-right: 6px;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .batch-approve-btn {
      background: #f6ffed;
      color: #52c41a;

      &:hover:not(:disabled) {
        background: #d9f7be;
      }
    }

    .regenerate-btn {
      background: #f0f5ff;
      color: #1890ff;

      &:hover:not(:disabled) {
        background: #e6f7ff;
      }
    }

    .test-btn {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }
    }
  }
}

.rules-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.rule-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #ddd;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  &.pending { border-left-color: #faad14; }
  &.approved { border-left-color: #52c41a; }

  .rule-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .rule-checkbox {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .rule-id {
      flex: 1;
      font-size: 12px;
      color: #999;
      font-family: monospace;
    }

    .status-badge {
      padding: 3px 10px;
      border-radius: 8px;
      font-size: 11px;

      &.pending {
        background: #fff7e6;
        color: #fa8c16;
      }
      &.approved {
        background: #f6ffed;
        color: #52c41a;
      }
    }
  }

  .rule-content {
    background: #f8f9fa;
    padding: 12px;
    border-radius: 8px;
    font-size: 12px;
    color: #333;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0 0 12px;
  }

  .rule-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 12px;

    .protocol, .attack-type, .target-packet {
      padding: 4px 10px;
      background: #f5f7fa;
      border-radius: 4px;
      font-size: 12px;
      color: #666;
    }

    .target-packet {
      background: #e6f7ff;
      color: #1890ff;
    }
  }

  .rule-actions {
    display: flex;
    gap: 8px;

    .action-btn {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      svg {
        width: 16px;
        height: 16px;
      }

      &.edit {
        background: #e6f7ff;
        color: #1890ff;

        &:hover {
          background: #bae7ff;
        }
      }

      &.approve {
        background: #f6ffed;
        color: #52c41a;

        &:hover {
          background: #d9f7be;
        }
      }

      

      &.regenerate {
        background: #f0f5ff;
        color: #1890ff;

        &:hover {
          background: #e6f7ff;
        }
      }
    }
  }

  }

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  width: 90%;
  max-width: 520px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(102, 126, 234, 0.1);
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 1px solid #e2e8f0;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: rgba(102, 126, 234, 0.1);
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(102, 126, 234, 0.2);
        color: #475569;
        transform: rotate(90deg);
      }

      svg {
        width: 16px;
        height: 16px;
      }
    }
  }

  .modal-body {
    padding: 24px;

    p {
      font-size: 14px;
      color: #64748b;
      line-height: 1.6;
      margin: 0 0 16px 0;
    }

    .rule-textarea, .reason-textarea, .suggestion-input {
      width: 100%;
      padding: 14px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-family: inherit;
      font-size: 14px;
      resize: vertical;
      background: #ffffff;
      color: #334155;
      transition: all 0.2s ease;

      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      &::placeholder {
        color: #94a3b8;
      }
    }

    .suggestion-input {
      font-family: inherit;
      min-height: 100px;
      line-height: 1.5;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid #e2e8f0;
    background: #fafbfc;

    .btn-secondary, .btn-cancel {
      padding: 12px 24px;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      background: #ffffff;
      color: #64748b;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;

      &:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      &:active {
        transform: translateY(0);
      }
    }

    .btn-primary, .btn-save {
      padding: 12px 28px;
      border: none;
      border-radius: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.35);

      &:hover {
        background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.45);
      }

      &:active {
        transform: translateY(0);
        box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
    }
  }
}

.test-progress-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;

  .test-progress-card {
    background: white;
    border-radius: 16px;
    padding: 40px;
    text-align: center;

    h3 {
      font-size: 18px;
      color: #333;
      margin-bottom: 20px;
    }

    .progress-bar-container {
      width: 300px;
      height: 12px;
      background: #f0f0f0;
      border-radius: 6px;
      overflow: hidden;
      margin: 0 auto 12px;

      .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #667eea, #764ba2);
        transition: width 0.3s;
      }
    }

    .progress-text {
      display: block;
      font-size: 24px;
      font-weight: 600;
      color: #667eea;
      margin-bottom: 8px;
    }

    .phase-text {
      font-size: 14px;
      color: #666;
    }
  }
}

.regeneration-progress-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;

  .regeneration-progress-card {
    background: white;
    border-radius: 20px;
    padding: 48px;
    text-align: center;
    min-width: 400px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    animation: slideUp 0.3s ease-out;

    .progress-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 24px;
      background: linear-gradient(135deg, #10b981, #34d399);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      animation: pulse 2s ease-in-out infinite;

      svg {
        width: 28px;
        height: 28px;
      }
    }

    h3 {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 28px;
      letter-spacing: 0.2px;
    }

    .progress-bar-container {
      width: 100%;
      height: 8px;
      background: #f3f4f6;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 20px;
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);

      .progress-bar.generation {
        height: 100%;
        background: linear-gradient(90deg, #10b981, #34d399);
        border-radius: 4px;
        transition: width 0.3s ease-out;
        box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
      }
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      .progress-percentage {
        font-size: 24px;
        font-weight: 700;
        color: #10b981;
      }

      .progress-message {
        font-size: 14px;
        color: #6b7280;
      }
    }

    .rules-count {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 4px;
      padding-top: 16px;
      border-top: 1px solid #f3f4f6;

      .count-label {
        font-size: 13px;
        color: #9ca3af;
        margin-right: 8px;
      }

      .count-value {
        font-size: 28px;
        font-weight: 700;
        color: #10b981;
      }

      .count-divider {
        font-size: 18px;
        font-weight: 400;
        color: #d1d5db;
        margin: 0 4px;
      }

      .count-total {
        font-size: 18px;
        font-weight: 500;
        color: #4b5563;
      }

      .count-unit {
        font-size: 13px;
        color: #9ca3af;
        margin-left: 8px;
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  }
  50% {
    box-shadow: 0 0 0 12px rgba(16, 185, 129, 0);
  }
}

.error-message {
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

  .close-error {
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

  .rules-list {
    grid-template-columns: 1fr;
  }
}
</style>