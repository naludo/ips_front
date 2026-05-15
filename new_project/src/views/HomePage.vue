<template>
  <!-- 首页容器 -->
  <div class="home-container">
    <!-- 侧边栏导航 -->
    <aside class="sidebar">
      <!-- Logo区域 -->
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
      <!-- 导航菜单 -->
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

    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 页面头部 -->
      <header class="page-header">
        <h1>欢迎使用IPS测试系统</h1>
        <p class="subtitle">上传PCAP文件，生成检测规则并进行回放测试</p>
      </header>

      <!-- 运行中工作流提示 -->
      <div v-if="hasRunningWorkflow && runningWorkflow" class="running-workflow-card" @click="continueRunningWorkflow">
        <div class="running-indicator"></div>
        <div class="running-info">
          <span class="running-label">有工作流正在运行</span>
          <span class="running-detail">{{ runningWorkflow.fileName }} - {{ runningWorkflow.status}}</span>
        </div>
        <button class="continue-btn">继续</button>
      </div>

      <!-- 快捷操作卡片 -->
      <div class="quick-actions">
        <!-- 新建工作流卡片 -->
        <div class="action-card primary" @click="navigateTo('/upload')">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <div class="action-info">
            <h3>新建工作流</h3>
            <p>上传PCAP报文文件，生成检测规则</p>
          </div>
          <span class="action-arrow">开始</span>
        </div>

        <!-- 工作流管理卡片 -->
        <div class="action-card" @click="navigateTo('/workflows')">
          <div class="action-icon purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <div class="action-info">
            <h3>工作流管理</h3>
            <p>查看和管理所有工作流</p>
          </div>
          <span class="action-arrow">管理</span>
        </div>

        <!-- 规则列表卡片 -->
        <div class="action-card" @click="navigateToRules()">
          <div class="action-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
          </div>
          <div class="action-info">
            <h3>规则列表</h3>
            <p>查看和审核生成的检测规则</p>
          </div>
          <span class="action-arrow">查看</span>
        </div>

        <!-- 测试结果卡片 -->
        <div class="action-card" @click="navigateToTest()">
          <div class="action-icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div class="action-info">
            <h3>测试结果</h3>
            <p>查看PCAP数据包重放测试结果</p>
          </div>
          <span class="action-arrow">分析</span>
        </div>
      </div>

      <!-- 核心功能展示区 -->
      <div class="features-section">
        <h2>核心功能</h2>
        <div class="features-grid">
          <!-- PCAP文件上传 -->
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <h3>PCAP文件上传</h3>
            <p>支持拖拽上传PCAP数据包文件，自动解析和处理网络流量数据</p>
          </div>
          <!-- 智能规则生成 -->
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 6V4m0 2a2 2 0 1 0 0 4m0-4a2 2 0 1 1 0 4m-6 8a2 2 0 1 0 0-4m0 4a2 2 0 1 1 0-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 1 0 0-4m0 4a2 2 0 1 1 0-4m0 4v2m0-6V4"/>
              </svg>
            </div>
            <h3>智能规则生成</h3>
            <p>基于AI算法自动生成Snort检测规则，支持多种攻击类型识别</p>
          </div>
          <!-- 规则审核 -->
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="16 12 12 8 8 12"/>
                <polyline points="12 16 12 12 8 12"/>
              </svg>
            </div>
            <h3>规则审核</h3>
            <p>支持规则审核、编辑、重新生成，确保规则质量和准确性</p>
          </div>
          <!-- 回放测试 -->
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
            <h3>回放测试</h3>
            <p>对审核通过的规则进行PCAP数据包回放测试，验证规则有效性</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * 首页组件
 * 功能：展示系统入口卡片，提供各模块导航
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWorkflowStore } from '@/stores/workflow'
import { getWorkflows } from '@/utils/api'
import type { Workflow } from '@/types'

// 获取路由实例
const router = useRouter()
const route = useRoute()
const store = useWorkflowStore()

// 当前路由路径，用于高亮导航菜单
const currentPath = ref(route.path)

// 工作流列表
const workflows = ref<Workflow[]>([])
const isLoading = ref(false)

// 导航菜单配置
const navItems = [
  { path: '/', label: '首页', icon: { viewBox: '0 0 24 24', path: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z' } },
  { path: '/upload', label: '新建任务', icon: { viewBox: '0 0 24 24', path: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' } },
  { path: '/workflows', label: '工作流管理', icon: { viewBox: '0 0 24 24', path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' } },
  { path: '/rules', label: '规则列表', icon: { viewBox: '0 0 24 24', path: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' } },
  { path: '/test', label: '测试结果', icon: { viewBox: '0 0 24 24', path: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' } }
]

// 是否有正在运行的工作流
const hasRunningWorkflow = computed(() => 
  workflows.value.some(w => ['pending' ,'analyzing','analyzed', 'generating' ,'generated',
    'loading','loaded','replaying','replayed','verifying'].includes(w.status))
)

// 当前运行中的工作流
const runningWorkflow = computed(() => 
  workflows.value.find(w => ['pending' ,'analyzing','analyzed', 'generating' ,'generated',
    'loading','loaded','replaying','replayed','verifying'].includes(w.status))
)

async function navigateToRules(): Promise<void> {
  if (runningWorkflow) {
    router.push(`/rules/${runningWorkflow.value?.workflowId}`)
    return
  }
  // 2. 查找第一个有规则的工作流（已完成规则生成的）
  const existingWorkflow = workflows.value.find(wf =>
      ['completed','cancelled'].includes(wf.status)
  )
  if (existingWorkflow) {
    router.push(`/rules/${existingWorkflow.workflowId}`)
    return
  }
  // 3. 无工作流，跳转到上传页面
  router.push('/workflows')
}

async function navigateToTest(): Promise<void> {
  // 1. 优先查找运行中的测试阶段工作流
  const completedWorkflow = workflows.value.find(wf =>
      ['completed'].includes(wf.status)
  )
  if (completedWorkflow) {
    router.push(`/test/${completedWorkflow.workflowId}`)
    return
  }
  if (runningWorkflow) {

    router.push(`/test/${runningWorkflow.value?.workflowId}`)
    return
  }
  // 4. 无工作流，跳转到上传页面
  router.push('/workflows')
}

// /**
//  * 获取工作流状态标签文本
//  */
// function getStatusLabel(status: string): string {
//   const labels: Record<string, string> = {
//     pending: '请点击开始生成规则',
//     generating: '规则生成中',
//     generated: '规则生成完毕，请审核'
//   }
//   return labels[status] || status
// }

/**
 * 继续工作流
 */
async function continueRunningWorkflow(): Promise<void> {
  if (!runningWorkflow.value) return
  
  const workflow = runningWorkflow.value
  //sessionStorage.setItem('selectedWorkflowId', workflow.workflowId)
  
  try {
    const targetRoute = store.getRouteByStatus(workflow.status)
    store.setCurrentWorkflow(workflow)
    store.setCurrentWorkflowId(workflow.workflowId)
    await router.push(targetRoute)
  } catch (error) {
    console.error('Continue workflow error:', error)
  }
}

/**
 * 导航跳转方法
 * @param path 目标路由路径
 */
function navigateTo(path: string): void {
  currentPath.value = path
  router.push(path)
}

/**
 * 加载工作流列表
 */
async function loadWorkflows(): Promise<void> {
  isLoading.value = true
  try {
    const response = await getWorkflows(1, 10)
    if (response.code === 200) {
      workflows.value = response.data.list
    }
  } catch (error) {
    console.error('Load workflows error:', error)
  } finally {
    isLoading.value = false
  }
}

// 组件挂载时执行
onMounted(() => {
  // 设置导航回调，供websocket消息处理时使用
  store.setNavigationCallback((path: string, workflowId?: string) => {
    if (workflowId) {
      router.push(`${path}/${workflowId}`)
    } else {
      router.push(path)
    }
  })
  // 加载工作流列表，检查是否有运行中的工作流
  loadWorkflows()
})
</script>

<style lang="scss" scoped>
.home-container {
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
  margin-bottom: 20px;

  h1 {
    font-size: 28px;
    color: #333;
    margin-bottom: 8px;
  }

  .subtitle {
    font-size: 14px;
    color: #666;
  }
}

.running-workflow-card {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #fff7e6 0%, #fff2e6 100%);
  border: 1px solid #ffe082;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: linear-gradient(135deg, #fff3e0 0%, #ffebee 100%);
    border-color: #ffd54f;
  }

  .running-indicator {
    width: 10px;
    height: 10px;
    background: #fa8c16;
    border-radius: 50%;
    margin-right: 14px;
    animation: pulse 2s infinite;
  }

  .running-info {
    flex: 1;

    .running-label {
      display: block;
      font-size: 13px;
      color: #fa8c16;
      font-weight: 500;
      margin-bottom: 2px;
    }

    .running-detail {
      font-size: 12px;
      color: #8b5a00;
    }
  }

  .continue-btn {
    padding: 8px 20px;
    background: #fa8c16;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #d46b08;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.action-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s;
  border-left: 4px solid #ddd;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-left-color: #5a6fd6;

    .action-icon {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .action-info h3,
    .action-info p,
    .action-arrow {
      color: white;
    }

    .action-info p {
      opacity: 0.8;
    }
  }

  .action-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: #f0f5ff;
    color: #667eea;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    svg {
      width: 28px;
      height: 28px;
    }

    &.purple {
      background: #f5f0ff;
      color: #764ba2;
    }

    &.blue {
      background: #e6f7ff;
      color: #1890ff;
    }

    &.orange {
      background: #fff7e6;
      color: #fa8c16;
    }
  }

  .action-info {
    flex: 1;
    min-width: 0;

    h3 {
      font-size: 16px;
      color: #333;
      margin-bottom: 4px;
    }

    p {
      font-size: 13px;
      color: #666;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .action-arrow {
    font-size: 13px;
    color: #667eea;
    font-weight: 500;
  }
}

.features-section {
  margin-bottom: 40px;

  h2 {
    font-size: 20px;
    color: #333;
    margin-bottom: 20px;
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  text-align: center;

  .feature-icon {
    width: 50px;
    height: 50px;
    margin: 0 auto 16px;
    background: #f5f7fa;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #667eea;

    svg {
      width: 24px;
      height: 24px;
    }
  }

  h3 {
    font-size: 15px;
    color: #333;
    margin-bottom: 8px;
  }

  p {
    font-size: 13px;
    color: #666;
    line-height: 1.6;
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

  .quick-actions {
    grid-template-columns: 1fr;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>