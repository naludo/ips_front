import { ref, computed } from 'vue'
import type { Workflow, Rule, TestResult } from '@/types'

// 当前运行中的工作流ID（全局状态）
const currentWorkflowId = ref<string>('')
const currentWorkflow = ref<Workflow | null>(null)

const rules = ref<Rule[]>([])
const testResult = ref<TestResult | null>(null)
const ruleGenerationProgress = ref<number>(0)
const generationMessage = ref<string>('')
const rulesGenerated = ref<number>(0)
const currentGenerationPhase = ref<string>('')
const testProgress = ref<number>(0)
const currentTestPhase = ref<string>('')
const workflowErrorMessage = ref<string>('')
// 当前工作流的最后成功步骤（用于出错时返回正确的界面）
const lastStep = ref<'upload' | 'rules' | 'test' | null>(null)
// 规则刷新标志（用于WebSocket通知组件刷新规则列表）
const rulesNeedRefresh = ref(false)
// 路由跳转回调
let navigationCallback: ((path: string, workflowId?: string) => void) | null = null
// 规则生成完成回调（用于直接通知组件）
let ruleGenerationCompleteCallback: (() => void) | null = null
// 规则生成失败回调（用于直接通知组件）
//let ruleGenerationFailedCallback: ((errorMessage: string) => void) | null = null

export function useWorkflowStore() {
  const approvedRules = computed(() => rules.value.filter(r => r.status === 'accepted'))
  const pendingRules = computed(() => rules.value.filter(r => r.status === 'pending'))

  // // 当前是否有运行中的工作流
  // const hasRunningWorkflow = computed(() => {
  //   return currentWorkflow.value &&
  //          ['pending', 'generating','generated','testing'].includes(currentWorkflow.value.status)
  // })

  function setCurrentWorkflowId(id: string): void {
    currentWorkflowId.value = id
  }

  function getCurrentWorkflowId(): string {
    return currentWorkflowId.value
  }

  function setCurrentWorkflow(workflow: Workflow | null): void {
    currentWorkflow.value = workflow
  }

  function setRules(newRules: Rule[]): void {
    rules.value = newRules
  }

  function updateRuleStatus(ruleId: string, status: 'pending' | 'approved'): void {
    const index = rules.value.findIndex(r => r.id === ruleId)
    if (index !== -1) {
      rules.value[index].status = status
    }
  }

  function updateRuleContent(ruleId: string, content: string): void {
    const index = rules.value.findIndex(r => r.id === ruleId)
    if (index !== -1) {
      rules.value[index].content = content
    }
  }

  function updateRules(updatedRules: Rule[]): void {
    updatedRules.forEach(updatedRule => {
      const index = rules.value.findIndex(r => r.id === updatedRule.id)
      if (index !== -1) {
        rules.value[index] = { ...rules.value[index], ...updatedRule, status: 'pending' }
      }
    })
  }

  function setTestResult(result: TestResult | null): void {
    testResult.value = result
  }

  function setRuleGenerationProgress(progress: number): void {
    ruleGenerationProgress.value = progress
  }

  function setGenerationMessage(message: string): void {
    generationMessage.value = message
  }

  function setRulesGenerated(count: number): void {
    rulesGenerated.value = count
  }

  function setCurrentGenerationPhase(phase: string): void {
    currentGenerationPhase.value = phase
  }

  function setTestProgress(progress: number): void {
    testProgress.value = progress
  }

  function setCurrentTestPhase(phase: string): void {
    currentTestPhase.value = phase
  }

  function setWorkflowErrorMessage(message: string): void {
    workflowErrorMessage.value = message
  }

  function clearWorkflowError(): void {
    workflowErrorMessage.value = ''
  }

  function setLastStep(step: 'upload' | 'rules' | 'test'): void {
    lastStep.value = step
  }

  function clearLastStep(): void {
    lastStep.value = null
  }

  function setRulesNeedRefresh(needRefresh: boolean): void {
    rulesNeedRefresh.value = needRefresh
  }

  function setNavigationCallback(callback: (path: string) => void): void {
    navigationCallback = callback
  }

  function navigateTo(path: string, workflowId?: string): void {
    if (navigationCallback) {
      navigationCallback(path, workflowId)
    }
  }

  function setRuleGenerationCompleteCallback(callback: () => void): void {
    ruleGenerationCompleteCallback = callback
  }

  function triggerRuleGenerationComplete(): void {
    if (ruleGenerationCompleteCallback) {
      ruleGenerationCompleteCallback()
    }
  }

  // function setRuleGenerationFailedCallback(callback: (errorMessage: string) => void): void {
  //   ruleGenerationFailedCallback = callback
  // }

  // function triggerRuleGenerationFailed(errorMessage: string): void {
  //   // 当规则生成失败时，需要根据工作流状态设置正确的 lastStep
  //   // 如果工作流状态是 uploading，说明是从 upload 页面发起的规则生成
  //   // 如果是 generating，需要判断是从 upload 还是 rules 页面发起的
  //   if (currentWorkflow.value) {
  //     switch (currentWorkflow.value.status) {
  //       case 'pending':
  //         // 上传阶段失败，回到 upload 页面
  //         lastStep.value = 'upload'
  //         console.log("set uploading", lastStep.value)
  //         break
  //       case 'generating':
  //         // 生成阶段失败，检查是否已经到过 rules 页面
  //         // 如果还没到过 rules 页面（lastStep 不是 'rules'），回到 upload
  //         if (lastStep.value !== 'rules') {
  //           lastStep.value = 'upload'
  //         }
  //         break
  //       default:
  //         // 默认回到 upload
  //         lastStep.value = 'upload'
  //     }
  //   }
  //
  //   if (ruleGenerationFailedCallback) {
  //     ruleGenerationFailedCallback(errorMessage)
  //   }
  // }

  /**
   * 根据工作流状态获取路由路径
   * @param status 工作流状态
   * @returns 路由路径
   */
  function getRouteByStatus(status: Workflow['status']): string {
    console.log("ErrorMessage",workflowErrorMessage.value)
    // 如果有错误，根据 lastStep 返回出错前的界面
    // if (lastStep.value) {
    //   switch (lastStep.value) {
    //     case 'upload':
    //       return '/upload'
    //     case 'rules':
    //       console.log("to rules", lastStep.value)
    //       return '/rules'
    //     case 'test':
    //       return '/test'
    //     default:
    //       return '/upload'
    //   }
    // }
    
    // 正常流程的路由
    switch (status) {
      case 'pending':
        return '/upload'
      case 'generating':
        return '/upload'
      case 'generated':
        console.log("turn to rules", lastStep.value)
        return `/rules/${currentWorkflowId.value}`
      // case 'testing':
      //   return '/test'
      // case 'completed':
      //   return '/test'
      // case 'cancelled':
      //   return '/workflow'
      default:
        return '/workflows'
    }
  }

  // /**
  //  * 判断是否需要重新建立WebSocket连接
  //  * @param workflowId 工作流ID
  //  * @returns 是否需要重新连接
  //  */
  // function needReconnect(workflowId: string): boolean {
  //   return currentWorkflowId.value !== workflowId
  // }

  // function reset(): void {
  //   currentWorkflowId.value = ''
  //   currentWorkflow.value = null
  //   rules.value = []
  //   testResult.value = null
  //   ruleGenerationProgress.value = 0
  //   generationMessage.value = ''
  //   rulesGenerated.value = 0
  //   currentGenerationPhase.value = ''
  //   testProgress.value = 0
  //   currentTestPhase.value = ''
  //   workflowErrorMessage.value = ''
  //   lastStep.value = null
  //   rulesNeedRefresh.value = false
  //   navigationCallback = null
  // }

  return {
    // 状态
    currentWorkflowId,
    currentWorkflow,
    rules,
    testResult,
    ruleGenerationProgress,
    generationMessage,
    rulesGenerated,
    currentGenerationPhase,
    testProgress,
    currentTestPhase,
    workflowErrorMessage,
    lastStep,
    rulesNeedRefresh,
    // 计算属性
    //hasRunningWorkflow,
    approvedRules,
    pendingRules,
    // 方法
    setCurrentWorkflowId,
    getCurrentWorkflowId,
    setCurrentWorkflow,
    setRules,
    updateRuleStatus,
    updateRuleContent,
    updateRules,
    setTestResult,
    setRuleGenerationProgress,
    setGenerationMessage,
    setRulesGenerated,
    setCurrentGenerationPhase,
    setTestProgress,
    setCurrentTestPhase,
    setWorkflowErrorMessage,
    clearWorkflowError,
    setLastStep,
    clearLastStep,
    setRulesNeedRefresh,
    setNavigationCallback,
    setRuleGenerationCompleteCallback,
    triggerRuleGenerationComplete,
    //setRuleGenerationFailedCallback,
    //triggerRuleGenerationFailed,

    navigateTo,
    getRouteByStatus,
    //needReconnect,
    //reset
  }
}
