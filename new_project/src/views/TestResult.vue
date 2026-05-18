<template>
  <div class="test-result-container">
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
          <h1>测试结果</h1>
          <p class="subheader">查看PCAP数据包重放测试结果，分析规则有效性</p>
        </div>
        <div class="workflow-selector">
          <span>选择工作流:</span>
          <select v-model="displayWorkflowId" @change="onWorkflowChange" class="workflow-select">
            <option value="">请选择工作流</option>
            <option v-for="wf in workflows" :key="wf.workflowId" :value="wf.workflowId">
              {{ formatWorkflowDisplay(wf) }}
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
        <div v-if="!testResult" class="loading-state">
          <div class="spinner"></div>
          <p>正在加载测试结果...</p>
        </div>

        <div v-else class="content">
          <div class="summary-section">
            <div class="summary-card">
              <h3>测试概览</h3>
              <div class="summary-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ testResult.totalRules }}</span>
                  <span class="stat-label">测试规则数</span>
                </div>
                <div class="stat-item hit">
                  <span class="stat-value">{{ testResult.hitCount }}</span>
                  <span class="stat-label">命中数</span>
                </div>
                <div class="stat-item miss">
                  <span class="stat-value">{{ testResult.missCount }}</span>
                  <span class="stat-label">未命中数</span>
                </div>
                <div class="stat-item error">
                  <span class="stat-value">{{ testResult.errorCount }}</span>
                  <span class="stat-label">错误数</span>
                </div>
              </div>
            </div>

            <div class="charts-card">
              <h3>测试指标</h3>
              <div class="charts-container">
                <div class="pie-chart">
                  <svg viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="40"
                      :stroke="hitColor"
                      stroke-width="20"
                      :stroke-dasharray="hitArc"
                      fill="none"
                      transform="rotate(-90 50 50)"
                    />
                    <circle
                      cx="50" cy="50" r="40"
                      :stroke="missColor"
                      stroke-width="20"
                      :stroke-dasharray="missArc"
                      fill="none"
                      :transform="`rotate(${hitAngle - 90} 50 50)`"
                    />
                    <circle
                      cx="50" cy="50" r="40"
                      :stroke="errorColor"
                      stroke-width="20"
                      :stroke-dasharray="errorArc"
                      fill="none"
                      :transform="`rotate(${hitAngle + missAngle - 90} 50 50)`"
                    />
                  </svg>
                  <div class="chart-center">
                    <span class="accuracy">{{ accuracy }}%</span>
                    <span class="accuracy-label">准确率</span>
                  </div>
                </div>
                <div class="legend">
                  <div class="legend-item">
                    <span class="legend-color" :style="{ background: hitColor }"></span>
                    <span class="legend-text">命中 ({{ testResult.hitCount }})</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-color" :style="{ background: missColor }"></span>
                    <span class="legend-text">未命中 ({{ testResult.missCount }})</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-color" :style="{ background: errorColor }"></span>
                    <span class="legend-text">错误 ({{ testResult.errorCount }})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="timing-section">
            <div class="timing-card">
              <h3>各阶段耗时</h3>
              <div class="timing-container">
                <div class="timing-list">
                  <div class="timing-item">
                    <div class="timing-icon analyze">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </div>
                    <div class="timing-info">
                      <span class="timing-name">数据包分析</span>
                      <span class="timing-duration">{{ testResult.phases.analyze }}s</span>
                      <div class="timing-bar-container">
                        <div class="timing-bar" :style="{ width: analyzePercentage + '%', background: analyzeColor }"></div>
                      </div>
                    </div>
                    <span class="timing-percentage">{{ analyzePercentage }}%</span>
                  </div>

                  <div class="timing-item">
                    <div class="timing-icon generate">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
                        <line x1="12" y1="22" x2="12" y2="15.5"/>
                      </svg>
                    </div>
                    <div class="timing-info">
                      <span class="timing-name">规则生成</span>
                      <span class="timing-duration">{{ testResult.phases.generate }}s</span>
                      <div class="timing-bar-container">
                        <div class="timing-bar" :style="{ width: generatePercentage + '%', background: generateColor }"></div>
                      </div>
                    </div>
                    <span class="timing-percentage">{{ generatePercentage }}%</span>
                  </div>

                  <div class="timing-item">
                    <div class="timing-icon load">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </div>
                    <div class="timing-info">
                      <span class="timing-name">规则加载</span>
                      <span class="timing-duration">{{ testResult.phases.load }}s</span>
                      <div class="timing-bar-container">
                        <div class="timing-bar" :style="{ width: loadPercentage + '%', background: loadColor }"></div>
                      </div>
                    </div>
                    <span class="timing-percentage">{{ loadPercentage }}%</span>
                  </div>

                  <div class="timing-item">
                    <div class="timing-icon replay">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 4 23 10 17 10"/>
                        <polyline points="1 20 1 14 7 14"/>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                      </svg>
                    </div>
                    <div class="timing-info">
                      <span class="timing-name">报文重放</span>
                      <span class="timing-duration">{{ testResult.phases.replay }}s</span>
                      <div class="timing-bar-container">
                        <div class="timing-bar" :style="{ width: replayPercentage + '%', background: replayColor }"></div>
                      </div>
                    </div>
                    <span class="timing-percentage">{{ replayPercentage }}%</span>
                  </div>

                  <div class="timing-item">
                    <div class="timing-icon test">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 12l2 2 4-4"/>
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                    </div>
                    <div class="timing-info">
                      <span class="timing-name">规则测试</span>
                      <span class="timing-duration">{{ testResult.phases.test }}s</span>
                      <div class="timing-bar-container">
                        <div class="timing-bar" :style="{ width: testPercentage + '%', background: testColor }"></div>
                      </div>
                    </div>
                    <span class="timing-percentage">{{ testPercentage }}%</span>
                  </div>
                </div>

                <div class="timing-chart">
                  <svg viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="40"
                      :stroke="analyzeColor"
                      stroke-width="20"
                      :stroke-dasharray="analyzeArc"
                      fill="none"
                      transform="rotate(-90 50 50)"
                      class="pie-segment"
                    />
                    <circle
                      cx="50" cy="50" r="40"
                      :stroke="generateColor"
                      stroke-width="20"
                      :stroke-dasharray="generateArc"
                      fill="none"
                      :transform="`rotate(${analyzeAngle - 90} 50 50)`"
                      class="pie-segment"
                    />
                    <circle
                      cx="50" cy="50" r="40"
                      :stroke="loadColor"
                      stroke-width="20"
                      :stroke-dasharray="loadArc"
                      fill="none"
                      :transform="`rotate(${analyzeAngle + generateAngle - 90} 50 50)`"
                      class="pie-segment"
                    />
                    <circle
                      cx="50" cy="50" r="40"
                      :stroke="replayColor"
                      stroke-width="20"
                      :stroke-dasharray="replayArc"
                      fill="none"
                      :transform="`rotate(${analyzeAngle + generateAngle + loadAngle - 90} 50 50)`"
                      class="pie-segment"
                    />
                    <circle
                      cx="50" cy="50" r="40"
                      :stroke="testColor"
                      stroke-width="20"
                      :stroke-dasharray="testArc"
                      fill="none"
                      :transform="`rotate(${analyzeAngle + generateAngle + loadAngle + replayAngle - 90} 50 50)`"
                      class="pie-segment"
                    />
                  </svg>
                  <div class="chart-center">
                    <span class="total-time">{{ formatDuration(testResult.totalTime) }}</span>
                    <span class="total-label">总耗时</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="rules-section">
            <div class="section-header">
              <h3>规则结果明细</h3>
              <button class="rules-btn" @click="navigateToRules()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                规则列表
              </button>
            </div>

            <div class="rules-table">
              <table>
                <thead>
                  <tr>
                    <th>规则ID</th>
                    <th>命中报文数</th>
                    <th>命中报文文件名</th>
                    <th>规则内容</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="rule in filteredRules" :key="rule.id">
                    <td class="rule-id">{{ rule.id }}</td>
                    <td>{{ rule.hitPacket?.length || 0 }}</td>
                    <td class="packet-names">
                      <div v-if="rule.hitPacket?.length && rule.hitPacket" class="names-list">
                        <span v-for="(packet, idx) in rule.hitPacket.slice(0, 3)" :key="idx">
                          {{ packet }}
                        </span>
                        <span v-if="rule.hitPacket.length > 3" class="more">
                          +{{ rule.hitPacket.length - 3 }} 更多
                        </span>
                        <span v-else-if="!rule.hitPacket?.length" class="no-hit">
                          无命中
                        </span>
                      </div>
                      <span v-else class="no-hit">无命中</span>
                    </td>
                    <td class="rule-content-cell">
                      <pre>{{ rule.content }}</pre>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="action-buttons">
            <button class="rules-btn-large" @click="navigateToRules()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              返回规则列表
            </button>
            <button class="download-btn" @click="downloadReport">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              导出报告
            </button>
          </div>
        </div>
      </template>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
        <button class="close-error" @click="errorMessage = ''">×</button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * 测试结果组件
 * 功能：展示PCAP数据包重放测试结果，分析规则有效性
 */
import { ref, computed, onMounted,watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getTestResult, getWorkflows } from '@/utils/api'
import { useWorkflowStore } from '@/stores/workflow'
import type { TestResult as TestResultType, Workflow } from '@/types'

// 获取路由实例和状态管理store
const router = useRouter()
const route = useRoute()
const store = useWorkflowStore()
if(!store.currentWorkflowId.value){
  const store_id=sessionStorage.getItem('currentWorkflowId')
  if(store_id){
    console.log('store_id',store_id)
    store.setCurrentWorkflowId(store_id)
  }
}
// 当前路由路径，用于高亮导航菜单
const currentPath = ref(route.path)

// 导航菜单配置
const navItems = [
  { path: '/', label: '首页', icon: { viewBox: '0 0 24 24', path: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z' } },
  { path: '/upload', label: '新建任务', icon: { viewBox: '0 0 24 24', path: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' } },
  { path: '/workflows', label: '工作流管理', icon: { viewBox: '0 0 24 24', path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' } },
  { path: `/rules/${store.currentWorkflowId.value}`, label: '规则列表', icon: { viewBox: '0 0 24 24', path: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' } },
  { path: `/test/${store.currentWorkflowId.value}`, label: '测试结果', icon: { viewBox: '0 0 24 24', path: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' } }
]

// 响应式状态变量
const workflows = ref<Workflow[]>([])           // 已完成的工作流列表
const displayWorkflowId = ref('')               // 当前页面显示的工作流ID（区别于store中的currentWorkflowId）
const testResult = ref<TestResultType | null>(null) // 测试结果数据
const errorMessage = ref('')                    // 错误提示消息

// 图表颜色配置
const hitColor = '#52c41a'    // 命中颜色（绿色）
const missColor = '#faad14'   // 未命中颜色（黄色）
const errorColor = '#ff4d4f'  // 错误颜色（红色）

// 各阶段颜色配置
const analyzeColor = '#6366f1'    // 数据包分析（靛蓝）
const generateColor = '#ec4899'   // 规则生成（粉色）
const loadColor = '#0ea5e9'       // 规则加载（蓝色）
const replayColor = '#10b981'     // 报文重放（绿色）
const testColor = '#f59e0b'       // 规则测试（橙色）

/**
 * 计算属性：测试准确率
 */
const accuracy = computed(() => {
  if (!testResult.value) return 0
  const { hitCount, totalRules } = testResult.value
  return totalRules > 0 ? Math.round((hitCount / totalRules) * 100) : 0
})

/**
 * 格式化时长（秒转时分秒）
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}时${minutes}分${secs}秒`
  } else if (minutes > 0) {
    return `${minutes}分${secs}秒`
  } else {
    return `${secs}秒`
  }
}

/**
 * 格式化工作流显示文本
 * @param workflow 工作流对象
 * @returns 格式化后的显示文本（文件名 + 创建时间）
 */
function formatWorkflowDisplay(workflow: Workflow): string {
  const date = new Date(workflow.createTime)
  const formattedDate = date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
  return `${workflow.fileName} (${formattedDate})`
}

/**
 * 计算属性：命中角度（用于饼图）
 */
const hitAngle = computed(() => {
  if (!testResult.value) return 0
  return (testResult.value.hitCount / testResult.value.totalRules) * 360
})

/**
 * 计算属性：未命中角度（用于饼图）
 */
const missAngle = computed(() => {
  if (!testResult.value) return 0
  return (testResult.value.missCount / testResult.value.totalRules) * 360
})

/**
 * 计算属性：命中弧线（SVG stroke-dasharray）
 */
const hitArc = computed(() => {
  const circumference = 2 * Math.PI * 40
  return `${(hitAngle.value / 360) * circumference} ${circumference}`
})

/**
 * 计算属性：未命中弧线（SVG stroke-dasharray）
 */
const missArc = computed(() => {
  const circumference = 2 * Math.PI * 40
  return `${(missAngle.value / 360) * circumference} ${circumference}`
})

/**
 * 计算属性：错误弧线（SVG stroke-dasharray）
 */
const errorArc = computed(() => {
  const circumference = 2 * Math.PI * 40
  if (!testResult.value) return `0 ${circumference}`
  const errorRatio = testResult.value.errorCount / testResult.value.totalRules
  return `${errorRatio * circumference} ${circumference}`
})

/**
 * 计算属性：根据筛选条件过滤规则
 */
const filteredRules = computed(() => {
  if (!testResult.value) return []
  return testResult.value.rules || []
})

/**
 * 计算属性：各阶段耗时百分比
 */
const analyzePercentage = computed(() => {
  if (!testResult.value || testResult.value.totalTime === 0) return 0
  return Math.round((testResult.value.phases.analyze / testResult.value.totalTime) * 100)
})

const generatePercentage = computed(() => {
  if (!testResult.value || testResult.value.totalTime === 0) return 0
  return Math.round((testResult.value.phases.generate / testResult.value.totalTime) * 100)
})

const loadPercentage = computed(() => {
  if (!testResult.value || testResult.value.totalTime === 0) return 0
  return Math.round((testResult.value.phases.load / testResult.value.totalTime) * 100)
})

const replayPercentage = computed(() => {
  if (!testResult.value || testResult.value.totalTime === 0) return 0
  return Math.round((testResult.value.phases.replay / testResult.value.totalTime) * 100)
})

const testPercentage = computed(() => {
  if (!testResult.value || testResult.value.totalTime === 0) return 0
  return Math.round((testResult.value.phases.test / testResult.value.totalTime) * 100)
})

/**
 * 各阶段角度计算（用于饼状图）
 */
const analyzeAngle = computed(() => {
  if (!testResult.value || testResult.value.totalTime === 0) return 0
  return (testResult.value.phases.analyze / testResult.value.totalTime) * 360
})

const generateAngle = computed(() => {
  if (!testResult.value || testResult.value.totalTime === 0) return 0
  return (testResult.value.phases.generate / testResult.value.totalTime) * 360
})

const loadAngle = computed(() => {
  if (!testResult.value || testResult.value.totalTime === 0) return 0
  return (testResult.value.phases.load / testResult.value.totalTime) * 360
})

const replayAngle = computed(() => {
  if (!testResult.value || testResult.value.totalTime === 0) return 0
  return (testResult.value.phases.replay / testResult.value.totalTime) * 360
})

const testAngle = computed(() => {
  if (!testResult.value || testResult.value.totalTime === 0) return 0
  return (testResult.value.phases.test / testResult.value.totalTime) * 360
})

/**
 * 各阶段弧线（SVG stroke-dasharray）
 */
const analyzeArc = computed(() => {
  const circumference = 2 * Math.PI * 40
  return `${(analyzeAngle.value / 360) * circumference} ${circumference}`
})

const generateArc = computed(() => {
  const circumference = 2 * Math.PI * 40
  return `${(generateAngle.value / 360) * circumference} ${circumference}`
})

const loadArc = computed(() => {
  const circumference = 2 * Math.PI * 40
  return `${(loadAngle.value / 360) * circumference} ${circumference}`
})

const replayArc = computed(() => {
  const circumference = 2 * Math.PI * 40
  return `${(replayAngle.value / 360) * circumference} ${circumference}`
})

const testArc = computed(() => {
  const circumference = 2 * Math.PI * 40
  return `${(testAngle.value / 360) * circumference} ${circumference}`
})

/**
 * 导航跳转方法
 * @param path 目标路由路径
 */
function navigateTo(path: string): void {
  currentPath.value = path
  router.push(path)
}

function navigateToRules():void{
  router.push(`/rules/${route.params.workflowId}`)
}

/**
 * 获取阶段标签文本
 * @param phase 阶段名称
 * @returns 阶段显示文本
 */
// function getPhaseLabel(phase: string): string {
//   const labels: Record<string, string> = {
//     loading: '规则加载',
//     replay: '报文回放',
//     testing: '命中验证'
//   }
//   return labels[phase] || phase
// }

/**
 * 加载测试结果
 */
async function loadTestResult(): Promise<void> {
  if (!displayWorkflowId.value) return

  try {
    const response = await getTestResult(displayWorkflowId.value)
    if (response.code === 200) {
      store.setTestResult(response.data)
      testResult.value = response.data
    }
  } catch (error) {
    errorMessage.value = '加载测试结果失败，请检查网络连接或该工作流是否已完成测试'
    console.error('Load test result error:', error)
  }
}

/**
 * 加载已完成的工作流列表
 */
async function loadWorkflows(): Promise<void> {
  try {
    const response = await getWorkflows(1, 50)
    if (response.code === 200) {
      // 只显示已完成的工作流
      workflows.value = response.data.list.filter(w => w.status === 'completed')
    }
  } catch (error) {
    console.error('Load workflows error:', error)
  }
}

/**
 * 工作流切换处理
 */
async function onWorkflowChange():Promise<void> {
  testResult.value = null
  await loadTestResult()
  if(displayWorkflowId.value){
    router.push(`/test/${displayWorkflowId.value}`)
  }
}

/**
 * 下载测试报告（CSV格式）
 */
function downloadReport(): void {
  if (!testResult.value) return

  const rules = testResult.value.rules || []
  
  let csvContent = '规则ID,命中报文文件名\n'
  
  rules.forEach(rule => {
    const hitPackets = rule.hitPacket || []
    if (hitPackets.length > 0) {
      hitPackets.forEach(packet => {
        const escapedPacket = packet.replace(/"/g, '""')
        csvContent += `"${rule.id}","${rule.content}",${escapedPacket}"\n`
      })
    } else {
      csvContent += `"${rule.id}","${rule.content}"\n`
    }
  })

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `test_report_${displayWorkflowId.value}_${Date.now()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 组件挂载时执行（实现可重入性）
 * 
 * 说明：
 * - displayWorkflowId：当前页面显示的工作流（可能是历史工作流）
 * - store.currentWorkflowId：当前运行中的工作流
 * - 测试结果页面默认显示测试中或已完成的工作流
 */
async function initOnMounted(): Promise<void> {
  // 记录最后成功步骤为 test
  store.setLastStep('test')
  
  await loadWorkflows()
  
  // 策略：默认显示当前工作流
  // const currentWfId = store.currentWorkflowId.value
  // if (currentWfId) {
  //   const workflow = workflows.value.find(w => w.workflowId === currentWfId)
  //   if (workflow) {
  //     displayWorkflowId.value = currentWfId
  //     loadTestResult()
  //   }
  // }
  const routeWorkflowId = route.params.workflowId as string
  if(routeWorkflowId){
    displayWorkflowId.value=routeWorkflowId
  }
  await loadTestResult()
}

watch(() => route.params.workflowId, (newWorkflowId:any) => {
  if (newWorkflowId && newWorkflowId !== displayWorkflowId.value) {
    displayWorkflowId.value = newWorkflowId as string
    loadTestResult()
  }
})

onMounted(() => {
  initOnMounted()
})
</script>

<style lang="scss" scoped>
.test-result-container {
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

    .workflow-select {
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      background: white;
      cursor: pointer;
      min-width: 350px;
      max-width: 500px;

      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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

.loading-state {
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

.content {
  .summary-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;

    .summary-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);

      h3 {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 20px;
      }

      .summary-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;

        .stat-item {
          text-align: center;
          padding: 16px 12px;
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          border-radius: 12px;
          transition: transform 0.2s, box-shadow 0.2s;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          }

          .stat-value {
            display: block;
            font-size: 28px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 6px;
          }

          .stat-label {
            font-size: 12px;
            color: #6b7280;
          }

          &.hit .stat-value { color: #52c41a; }
          &.miss .stat-value { color: #faad14; }
          &.error .stat-value { color: #ff4d4f; }
        }
      }
    }

    .charts-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);

      h3 {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 20px;
      }

      .charts-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 32px;

        .pie-chart {
          position: relative;
          width: 160px;
          height: 160px;

          .chart-center {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;

            .accuracy {
              display: block;
              font-size: 32px;
              font-weight: 700;
              color: #667eea;
            }

            .accuracy-label {
              font-size: 12px;
              color: #9ca3af;
            }
          }
        }

        .legend {
          display: flex;
          flex-direction: column;
          gap: 14px;

          .legend-item {
            display: flex;
            align-items: center;
            gap: 10px;

            .legend-color {
              width: 18px;
              height: 18px;
              border-radius: 6px;
            }

            .legend-text {
              font-size: 14px;
              color: #4b5563;
            }
          }
        }
      }
    }
  }

  .timing-section {
    margin-bottom: 20px;

    .timing-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);

      h3 {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 20px;
      }

      .timing-container {
        display: flex;
        align-items: center;
        gap: 32px;
      }

      .timing-list {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .timing-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
        border-radius: 12px;
        transition: all 0.2s;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .timing-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: white;

          svg {
            width: 16px;
            height: 16px;
          }

          &.analyze {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
          }

          &.generate {
            background: linear-gradient(135deg, #ec4899, #f43f5e);
          }

          &.load {
            background: linear-gradient(135deg, #0ea5e9, #3b82f6);
          }

          &.replay {
            background: linear-gradient(135deg, #10b981, #34d399);
          }

          &.test {
            background: linear-gradient(135deg, #f59e0b, #fbbf24);
          }
        }

        .timing-info {
          flex: 1;
          min-width: 0;

          .timing-name {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: #1f2937;
            margin-bottom: 4px;
          }

          .timing-duration {
            display: inline-block;
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 6px;
          }

          .timing-bar-container {
            height: 6px;
            background: #e5e7eb;
            border-radius: 3px;
            overflow: hidden;

            .timing-bar {
              height: 100%;
              border-radius: 3px;
              transition: width 0.5s ease-out;
            }
          }
        }

        .timing-percentage {
          font-size: 13px;
          font-weight: 600;
          color: #4b5563;
          min-width: 40px;
          text-align: right;
        }
      }

      .timing-chart {
        position: relative;
        width: 180px;
        height: 180px;
        flex-shrink: 0;

        svg {
          width: 100%;
          height: 100%;
        }

        .pie-segment {
          transition: stroke-dasharray 0.8s ease-out;
        }

        .chart-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;

          .total-time {
            display: block;
            font-size: 24px;
            font-weight: 700;
            color: #6366f1;
            margin-bottom: 4px;
          }

          .total-label {
            font-size: 12px;
            color: #9ca3af;
          }
        }
      }
    }
  }

  .rules-section {
    background: white;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h3 {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
      }

      .rules-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: linear-gradient(135deg, #f0f5ff 0%, #e0e7ff 100%);
        border: 1px solid #c7d2fe;
        border-radius: 8px;
        color: #6366f1;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;

        svg {
          width: 14px;
          height: 14px;
        }

        &:hover {
          background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
          border-color: #a5b4fc;
          transform: translateY(-1px);
        }
      }
    }

    .rules-table {
      overflow-x: auto;

      table {
        width: 100%;
        border-collapse: collapse;

        thead {
          tr {
            border-bottom: 2px solid #f0f0f0;
          }

          th {
            padding: 10px 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            color: #333;
          }
        }

        tbody {
          tr {
            border-bottom: 1px solid #f0f0f0;
            transition: background 0.2s;

            &:hover {
              background: #fafafa;
            }

            td {
              padding: 10px 12px;
              font-size: 13px;
              color: #666;
            }

            .rule-id {
              font-family: monospace;
              font-size: 12px;
            }

            .result-badge {
              padding: 3px 10px;
              border-radius: 8px;
              font-size: 11px;

              &.hit {
                background: #f6ffed;
                color: #52c41a;
              }
              &.miss {
                background: #fff7e6;
                color: #fa8c16;
              }
              &.error {
                background: #fff2f0;
                color: #ff4d4f;
              }
            }

            .packet-names {
              min-width: 150px;
              max-width: 200px;

              .names-list {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
              }

              span {
                padding: 2px 6px;
                background: #f0f5ff;
                border-radius: 3px;
                font-size: 11px;
                color: #1890ff;
              }

              .more {
                background: #fff7e6;
                color: #fa8c16;
              }

              .no-hit {
                background: #f5f5f5;
                color: #999;
              }
            }

            .rule-content-cell {
              max-width: 300px;

              pre {
                margin: 0;
                font-size: 11px;
                color: #333;
                overflow-x: auto;
                white-space: pre-wrap;
                word-break: break-all;
              }
            }
          }
        }
      }
    }
  }

  .action-buttons {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 24px;

    .rules-btn-large {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #f0f5ff 0%, #e0e7ff 100%);
      border: 1px solid #c7d2fe;
      border-radius: 10px;
      color: #6366f1;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      svg {
        width: 16px;
        height: 16px;
      }

      &:hover {
        background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
        border-color: #a5b4fc;
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(99, 102, 241, 0.15);
      }
    }

    .download-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      svg {
        width: 16px;
        height: 16px;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35);
      }
    }
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

@media (max-width: 1024px) {
  .timing-container {
    flex-direction: column;
    align-items: flex-start;
  }

  .timing-chart {
    align-self: center;
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

  .summary-section {
    grid-template-columns: 1fr;
  }

  .charts-container {
    flex-direction: column;
  }

  .timing-container {
    flex-direction: column;
    align-items: center;
  }

  .timing-list {
    width: 100%;
  }

  .timing-chart {
    width: 160px;
    height: 160px;
  }
}
</style>