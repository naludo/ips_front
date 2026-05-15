export interface Rule {
  id: string
  workflowId: string
  content: string
  protocol: string
  status: 'pending' | 'accepted'
  targetPacket: string
}
export interface TestedRule{
  id: string
  workflowId: string
  content: string
  protocol: string
  status:  'accepted'
  hitPacket: string[]
}

export interface Workflow {
  workflowId: string
  status: 'pending' |'analyzing'|'analyzed'| 'generating' |'generated'|
      'loading'|'loaded'|'replaying'|'replayed'|'verifying'|'completed'|'cancelled'|'failed',
  createTime: string
  updateTime: string
  rulesTotal: number
  rulesApproved: number
  isCompleted: boolean
  fileName: string
}

export interface ErrorMessage {
  workflowId: string
  errorType: string
  errorMessage: string
  time: string
}

export interface TestResult {
  workflowId: string
  totalRules: number
  hitCount: number
  missCount: number
  errorCount: number
  rules: TestedRule[]
  phases: {
    analyze: number
    generate: number
    load: number
    replay: number
    test: number
  }
  startTime: string
  endTime: string
  totalTime: number
}

export interface RuleGenerationProgressMessage {
  type: 'rule_generation_progress'
  workflowId: string
  progress: number
  message: string
  phase: 'analyzing' | 'generating'
  rulesGenerated: number
}

export interface RuleGenerationCompleteMessage {
  type: 'rule_generation_complete'
  workflowId: string
  rulesCount: number
}

export interface RuleGenerationErrorMessage {
  type: 'rule_generation_error'
  workflowId: string
  errorCode: string
  message: string
}

export interface TestPhaseUpdateMessage {
  type: 'test_phase_update'
  workflowId: string
  progress: number
  phase: 'loading' | 'replay' | 'testing'
  duration: number
}


export interface TestErrorMessage {
  type: 'test_error'
  workflowId: string
  errorCode: string
  message: string
}

export interface TestCompleteMessage {
  type: 'test_complete'
  workflowId: string
}

export type WebSocketMessage =
  | RuleGenerationProgressMessage
  | RuleGenerationCompleteMessage
  | RuleGenerationErrorMessage
  | TestPhaseUpdateMessage
  | TestCompleteMessage
  | TestErrorMessage

export type SubscribeType =
  | 'rule_generation_progress'
  | 'rule_generation_complete'
  | 'rule_generation_error'
  | 'test_phase_update'
  | 'test_complete'
    |'tets_error'

export interface SubscribeRequest {
  type: 'subscribe'
  workflowId: string
  subscribeTypes: SubscribeType[]
}

export interface HeartbeatRequest {
  type: 'heartbeat'
  timestamp: number
}

export type OutgoingMessage = SubscribeRequest | HeartbeatRequest

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}
