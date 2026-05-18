<template>
  <div class="upload-container">
    <div class="upload-card">
      <div class="upload-header">
        <h2>IPS测试系统</h2>
        <p class="subtitle">上传PCAP文件开始规则生成</p>
      </div>

      <!-- 状态一：上传窗口 -->
      <div v-if="currentState === 'upload'" class="upload-state">
        <div
          class="upload-area"
          :class="{ 'drag-over': isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".zip"
            class="file-input"
            @change="handleFileSelect"
          />
          <div class="upload-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <p class="upload-text">{{ selectedFile ? selectedFile.name : '点击或拖拽上传PCAP文件 (.zip)' }}</p>
          <p class="upload-hint">支持 .zip 格式，最大200MB</p>
        </div>

        <div v-if="selectedFile && !uploadProgress" class="file-info">
          <span class="file-name">{{ selectedFile.name }}</span>
          <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
          <button class="remove-file-btn" @click.stop="removeFile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="progress-section" v-if="uploadProgress > 0 && uploadProgress < 100">
          <div class="progress-bar-container">
            <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
          </div>
          <span class="progress-text">{{ uploadProgress }}%</span>
        </div>

        <button
          class="upload-btn"
          :disabled="!selectedFile || isUploading"
          @click="onUploadFile"
        >
          <span v-if="!isUploading">上传文件</span>
          <span v-else>上传中...</span>
        </button>
      </div>

      <!-- 状态二：上传完成 -->
      <div v-else-if="currentState === 'uploaded'" class="uploaded-state">
        <div class="uploaded-content">
          <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h3>文件上传成功</h3>
          <p class="uploaded-file-name">{{ uploadedFileName }}</p>
        </div>
        
        <button
          class="generate-btn"
          :disabled="isGenerating"
          @click="startRuleGeneration"
        >
          <span v-if="!isGenerating">开始生成规则</span>
          <span v-else>处理中...</span>
        </button>
      </div>

      <!-- 状态三：规则生成中 -->
      <div v-else-if="currentState === 'generating'" class="generating-state">
        <div class="generation-content">
          <div class="progress-icon">
            <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-linecap="round"/>
            </svg>
          </div>
          <h3>规则生成中</h3>
          
          <div class="generation-progress">
            <div class="progress-bar-container">
              <div class="progress-bar generation" :style="{ width: ruleGenerationProgress + '%' }"></div>
            </div>
            <div class="progress-info">
              <span class="progress-percent">{{ ruleGenerationProgress }}%</span>
              <span class="progress-message">{{ generationMessage }}</span>
            </div>
            <span class="phase-text">当前阶段: {{ currentGenerationPhaseLabel }}</span>
            <span class="rules-count">已生成: {{ rulesGenerated }} 条规则</span>
          </div>
        </div>
      </div>

<!--      &lt;!&ndash; 状态四：规则生成失败 &ndash;&gt;-->
<!--      <div v-if="currentState === 'error'" class="error-state">-->
<!--        <div class="error-content">-->
<!--          <div class="error-icon">-->
<!--            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">-->
<!--              <circle cx="12" cy="12" r="10"/>-->
<!--              <line x1="12" y1="8" x2="12" y2="12"/>-->
<!--              <line x1="12" y1="16" x2="12" y2="16"/>-->
<!--            </svg>-->
<!--          </div>-->
<!--          <h3>规则生成失败</h3>-->
<!--          <p class="error-text">{{ workflowErrorMessage || errorMessage }}</p>-->
<!--          <button class="retry-btn" @click="retryGeneration">-->
<!--            重新生成-->
<!--          </button>-->
<!--        </div>-->
<!--      </div>-->

      <!-- 错误提示（上传阶段的错误） -->
      <div v-if="currentState === 'upload' && errorMessage" class="error-message">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12" y2="16"/>
        </svg>
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * PCAP文件上传组件
 * 功能：上传PCAP数据包文件，触发规则生成，展示上传和生成进度
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {uploadFile, generateRules, getWorkflow, getWorkflows} from '@/utils/api'
import { websocketManager } from '@/utils/websocket'
import { useWorkflowStore } from '@/stores/workflow'

// 获取状态管理store
const store = useWorkflowStore()
const router = useRouter()

// 界面状态枚举
type UploadState = 'upload' | 'uploaded' | 'generating'

// 响应式状态变量
const fileInput = ref<HTMLInputElement | null>(null)        // 文件输入框引用
const selectedFile = ref<File | null>(null)                 // 选中的文件
const uploadedFileName = ref('')                            // 已上传的文件名
const isDragging = ref(false)                               // 是否正在拖拽
const isUploading = ref(false)                              // 是否正在上传
const uploadProgress = ref(0)                               // 上传进度
const isGenerating = ref(false)                             // 是否正在生成规则
const currentState = ref<UploadState>('upload')             // 当前界面状态

// 规则生成进度（从store获取）
const ruleGenerationProgress = computed(() => store.ruleGenerationProgress.value)
const generationMessage = computed(() => store.generationMessage.value)
const rulesGenerated = computed(() => store.rulesGenerated.value)
const currentGenerationPhase = computed(() => store.currentGenerationPhase.value)
const errorMessage = ref('')                                // 错误消息
//const workflowErrorMessage = computed(() => store.workflowErrorMessage.value) // 工作流错误信息

// 规则生成阶段中文映射
const generationPhaseLabels: Record<string, string> = {
  analyzing: '分析中',
  generating: '生成中'
}

// 当前规则生成阶段的中文显示
const currentGenerationPhaseLabel = computed(() => {
  return generationPhaseLabels[currentGenerationPhase.value] || currentGenerationPhase.value
})

/**
 * 触发文件选择对话框
 */
function triggerFileInput(): void {
  fileInput.value?.click()
}

/**
 * 处理文件选择事件
 * @param event 事件对象
 */
function handleFileSelect(event: Event): void {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    validateFile(file)
  }
}

/**
 * 处理文件拖放事件
 * @param event 拖放事件对象
 */
function handleDrop(event: DragEvent): void {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    validateFile(file)
  }
}

/**
 * 删除已选择的文件，允许用户重新选择
 */
function removeFile(): void {
  selectedFile.value = null
  errorMessage.value = ''
  // 重置文件输入框，允许重新选择同一文件
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

/**
 * 验证文件格式和大小
 * @param file 待验证的文件
 */
function validateFile(file: File): void {
  // 验证文件格式
  if (!file.name.endsWith('.zip')) {
    errorMessage.value = '文件格式不正确，请上传.zip文件'
    return
  }
  // 验证文件大小（最大200MB）
  if (file.size > 200 * 1024 * 1024) {
    errorMessage.value = '文件大小超过限制，最大支持200MB'
    return
  }
  // 验证通过，清除错误并保存文件
  errorMessage.value = ''
  selectedFile.value = file
}

/**
 * 格式化文件大小显示
 * @param bytes 文件字节数
 * @returns 格式化后的文件大小字符串
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

/**
 * 检查是否有运行中的工作流
 */
async function checkRunningWorkflow(): Promise<boolean> {
  try {
    const response = await getWorkflows(1, 10)
    if (response.code === 200) {
      return response.data.list.some(w => !['completed', 'failed', 'cancelled'].includes(w.status))
    }
    return false
  } catch (error) {
    console.error('Check running workflow error:', error)
    return false
  }
}

/**
 * 处理文件上传
 */
async function handleUpload(): Promise<void> {
  if (!selectedFile.value) return

  const hasRunning = await checkRunningWorkflow()
  if (hasRunning) {
    errorMessage.value = '已有工作流正在运行，请先完成当前工作流'
    return
  }

  isUploading.value = true
  errorMessage.value = ''
  uploadProgress.value = 0

  try {
    //模拟上传进度
    const progressInterval = setInterval(() => {
      uploadProgress.value += Math.floor(Math.random() * 20) + 10
      if (uploadProgress.value >= 100) {
        uploadProgress.value = 100
        clearInterval(progressInterval)
      }
    }, 300)

    // 调用API上传文件
    const response = await uploadFile(selectedFile.value)
    
    clearInterval(progressInterval)
    uploadProgress.value = 100

    if (response.code === 200) {
      // 上传成功，保存工作流ID和文件名
      uploadedFileName.value = selectedFile.value.name
      store.setCurrentWorkflowId(response.data.workflowId)
      sessionStorage.setItem("currentWorkflowId", response.data.workflowId)
      // 记录最后成功步骤
      store.setLastStep('upload')
      // 建立WebSocket连接监听进度
      connectWebSocket()
      // 切换到上传完成状态
      currentState.value = 'uploaded'
    } else {
      errorMessage.value = response.message || '上传失败'
    }
  } catch (error) {
    errorMessage.value = '上传失败，请检查网络连接'
    console.error('Upload error:', error)
  } finally {
    isUploading.value = false
  }
}

/**
 * 建立WebSocket连接
 */
function connectWebSocket(): void {
  websocketManager.connect(store.currentWorkflowId.value)
}

/**
 * 启动规则生成
 */
async function startRuleGeneration(): Promise<void> {
  if (!store.currentWorkflowId.value) return

  isGenerating.value = true
  store.setRuleGenerationProgress(0)
  store.setGenerationMessage('开始生成规则...')
  store.setCurrentGenerationPhase('')
  errorMessage.value = ''

  // 切换到生成中状态
  currentState.value = 'generating'

  try {
    const response = await generateRules(store.currentWorkflowId.value)
    if (response.code !== 200) {
      errorMessage.value = response.message || '启动规则生成失败'
      isGenerating.value = false
      //currentState.value = 'error'
    }
  } catch (error) {
    errorMessage.value = '启动规则生成失败，请检查网络连接'
    isGenerating.value = false
    //currentState.value = 'error'
    console.error('Generate rules error:', error)
  }
}

// /**
//  * 重试规则生成（重新调用后端接口）
//  */
// async function retryGeneration(): Promise<void> {
//   if (!store.currentWorkflowId.value) return
//
//   isGenerating.value = true
//   store.setRuleGenerationProgress(0)
//   store.setGenerationMessage('重新生成规则...')
//   store.setCurrentGenerationPhase('')
//   //store.clearWorkflowError()
//   errorMessage.value = ''
//
//   // 切换到生成中状态
//   currentState.value = 'generating'
//
//   try {
//     const response = await generateRules(store.currentWorkflowId.value)
//     if (response.code !== 200) {
//       errorMessage.value = response.message || '重新生成规则失败'
//       isGenerating.value = false
//       currentState.value = 'error'
//     }
//   } catch (error) {
//     errorMessage.value = '重新生成规则失败，请检查网络连接'
//     isGenerating.value = false
//     currentState.value = 'error'
//     console.error('Retry generate rules error:', error)
//   }
// }

/**
 * 上传按钮点击处理
 */
function onUploadFile(): void {
  handleUpload()
}

/**
 * 组件挂载时检查工作流状态（实现可重入性）
 */
async function initOnMounted(): Promise<void> {
  // 设置导航回调，确保路由跳转在Vue上下文中执行
  store.setNavigationCallback((path: string, workflowId?: string) => {
    if (workflowId) {
      router.push(`${path}/${workflowId}`)
    } else {
      router.push(path)
    }
  })
  
  // 重置store中的进度状态
  store.setRuleGenerationProgress(0)
  store.setGenerationMessage('')
  store.setRulesGenerated(0)
  store.setCurrentGenerationPhase('')
  // 重置界面状态
  currentState.value = 'upload'
  uploadProgress.value = 0
  uploadedFileName.value = ''

  // 检查是否有保存的工作流ID（从工作流列表点击继续或刷新页面）
  const storedWorkflowId = store.getCurrentWorkflowId();
  if (storedWorkflowId) {
    // 获取工作流详情，确认当前状态
    try {
      //const error_response = await getWorkflowError(storedWorkflowId)
      const response = await getWorkflow(storedWorkflowId)
      if (response.code === 200) {
        const workflow = response.data
        store.setCurrentWorkflow(workflow)
        store.setCurrentWorkflowId(workflow.workflowId)
        // 根据工作流状态决定显示内容
        if (workflow.status === 'pending') {
          // 如果是uploading状态，且已有文件名，显示上传完成状态
          uploadedFileName.value = workflow.fileName
          currentState.value = 'uploaded'
        } else if (['analyzing','analyzed','generating'].includes(workflow.status)) {
          // 如果工作流正在生成中，显示生成中状态
          uploadedFileName.value = workflow.fileName
          currentState.value = 'generating'
        }
        // if(error_response.code === 200) {
        //   if(error_response.data.errorMessage&&workflow.status!="completed") {
        //     currentState.value = 'error'
        //   }
        // }
      }
    } catch (error) {
      console.error('Get workflow on mount error:', error)
    }
  }
}

/**
 * 组件挂载时执行
 */
onMounted(() => {
  initOnMounted()
})
</script>

<style lang="scss" scoped>
.upload-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.upload-card {
  width: 100%;
  max-width: 500px;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.upload-header {
  text-align: center;
  margin-bottom: 30px;

  h2 {
    font-size: 28px;
    color: #333;
    margin-bottom: 8px;
  }

  .subtitle {
    color: #666;
    font-size: 14px;
  }
}

/* 上传状态 */
.upload-state {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &.drag-over {
    border-color: #667eea;
    background-color: #f5f7ff;
  }
}

.file-input {
  display: none;
}

.upload-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  color: #667eea;

  svg {
    width: 100%;
    height: 100%;
  }
}

.upload-text {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 12px;
  color: #999;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-top: 20px;

  .file-name {
    flex: 1;
    font-size: 14px;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-size {
    font-size: 12px;
    color: #666;
    flex-shrink: 0;
  }

  .remove-file-btn {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 50%;
    background-color: #fff;
    color: #999;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;

    svg {
      width: 14px;
      height: 14px;
    }

    &:hover {
      background-color: #dc3545;
      color: white;
    }
  }
}

.progress-section {
  margin-top: 20px;

  .progress-bar-container {
    height: 8px;
    background-color: #eee;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #667eea, #764ba2);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .progress-text {
    font-size: 14px;
    color: #666;
    display: block;
    text-align: center;
  }
}

.upload-btn {
  width: 100%;
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

/* 上传完成状态 */
.uploaded-state {
  text-align: center;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.uploaded-content {
  padding: 20px;

  .success-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    color: #52c41a;

    svg {
      width: 100%;
      height: 100%;
    }
  }

  h3 {
    font-size: 20px;
    color: #333;
    margin-bottom: 12px;
  }

  .uploaded-file-name {
    font-size: 14px;
    color: #666;
    padding: 12px 16px;
    background-color: #f6ffed;
    border: 1px solid #b7eb8f;
    border-radius: 8px;
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.generate-btn {
  width: 100%;
  padding: 16px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 24px;
  background-color: #52c41a;
  color: white;

  &:hover:not(:disabled) {
    background-color: #43a047;
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(82, 196, 26, 0.35);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

/* 规则生成中状态 */
.generating-state {
  text-align: center;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.generation-content {
  padding: 20px;

  .progress-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 20px;
    color: #667eea;

    .spinner {
      width: 100%;
      height: 100%;
      animation: spin 1s linear infinite;
    }
  }

  h3 {
    font-size: 20px;
    color: #333;
    margin-bottom: 24px;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.generation-progress {
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 24px;

  .progress-bar-container {
    height: 16px;
    background-color: #e8e8e8;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 16px;
  }

  .progress-bar.generation {
    height: 100%;
    background: linear-gradient(90deg, #52c41a, #73d13d);
    border-radius: 8px;
    transition: width 0.3s ease;
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .progress-percent {
    font-size: 24px;
    font-weight: 600;
    color: #52c41a;
  }

  .progress-message {
    font-size: 14px;
    color: #666;
  }

  .phase-text {
    font-size: 13px;
    color: #1890ff;
    display: block;
    margin-bottom: 8px;
  }

  .rules-count {
    font-size: 12px;
    color: #999;
  }
}

/* 错误状态 */
.error-state {
  text-align: center;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.error-content {
  padding: 20px;

  .error-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    color: #ff4d4f;

    svg {
      width: 100%;
      height: 100%;
    }
  }

  h3 {
    font-size: 20px;
    color: #ff4d4f;
    margin-bottom: 12px;
  }

  .error-text {
    font-size: 14px;
    color: #666;
    margin-bottom: 20px;
  }
}

.retry-btn {
  padding: 14px 32px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fff;
  color: #667eea;
  border: 2px solid #667eea;

  &:hover {
    background-color: #667eea;
    color: white;
  }
}

/* 通用错误消息 */
.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  background-color: #fff2f0;
  border-radius: 8px;
  margin-top: 16px;
  color: #ff4d4f;
  font-size: 14px;

  svg {
    width: 18px;
    height: 18px;
    margin-right: 8px;
  }
}
</style>