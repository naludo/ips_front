import type { WebSocketMessage, SubscribeRequest, HeartbeatRequest, SubscribeType } from '@/types'
import { useWorkflowStore } from '@/stores/workflow'
import router from '@/router'

class WebSocketManager {
  private ws: WebSocket | null = null
  private workflowId: string = ''
  private messageHandler: ((message: WebSocketMessage) => void) | null = null
  //private reconnectAttempts = 0
  //private maxReconnectAttempts = 2
  private store = useWorkflowStore()

  constructor() {
    this.setupAutoReconnect()
  }

  private setupAutoReconnect(): void {
    window.addEventListener('load', () => {
      const lastWorkflowId = sessionStorage.getItem('lastWorkflowId')
      if (lastWorkflowId && !this.isConnected()) {
        console.log('页面刷新，自动重连到工作流:', lastWorkflowId)
        this.connect(lastWorkflowId)
      }
    })
  }

  connect(workflowId: string, handler?: (message: WebSocketMessage) => void): void {
    this.messageHandler = handler || null

    if (this.isConnected()) {
      console.log(`WebSocket already connected, switching to workflow: ${workflowId}`)
      sessionStorage.setItem('lastWorkflowId', workflowId)
      this.workflowId = workflowId
      this.sendSubscribe()
      return
    }

    this.workflowId = workflowId
    sessionStorage.setItem('lastWorkflowId', workflowId)

    const url = 'ws://10.182.173.176:8000/ws/workflows'

    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      //this.reconnectAttempts = 0
      this.sendSubscribe()
    }

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage
        this.handleMessage(message)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    this.ws.onerror = (error: Event) => {
      console.error('WebSocket error:', error)
    }

    // this.ws.onclose = () => {
    //   if (this.reconnectAttempts < this.maxReconnectAttempts) {
    //     setTimeout(() => {
    //       this.reconnectAttempts++
    //       this.connect(workflowId, handler)
    //     }, 2000 * this.reconnectAttempts)
    //   }
    // }
  }

  private handleMessage(message: WebSocketMessage): void {
    console.log('WebSocket message received:', message)
    
    switch (message.type) {
      case 'rule_generation_progress':
        this.store.setRuleGenerationProgress(message.progress)
        this.store.setGenerationMessage(message.message)
        this.store.setRulesGenerated(message.rulesGenerated)
        this.store.setCurrentGenerationPhase(message.phase)
        break
      case 'rule_generation_complete':
        this.store.setRuleGenerationProgress(100)
        console.log('Rule generation complete')
        this.store.triggerRuleGenerationComplete()
        if (router?.currentRoute.value.path !== `/rules/${this.workflowId}`) {
          this.store.navigateTo('/rules', this.workflowId)
        }
        break
      case 'rule_generation_error':
        this.store.setGenerationMessage(message.message || '规则生成失败')
        this.store.setRuleGenerationProgress(0)
        this.store.setWorkflowErrorMessage(message.message || '规则生成失败')
        //this.store.triggerRuleGenerationFailed(message.message || '规则生成失败')
        console.log("Show ErrorMessage:",this.store.workflowErrorMessage)
        this.store.navigateTo('/workflows')
        break
      case 'test_phase_update':
        this.store.setCurrentTestPhase(message.phase)
        this.store.setTestProgress(message.progress)
        break
      case 'test_complete':
        this.store.setTestProgress(100)
        console.log('Test complete, navigating to /test')
        this.store.navigateTo('/test', this.workflowId)
        break
    }

    this.messageHandler?.(message)
  }

  private sendSubscribe(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const subscribeTypes: SubscribeType[] = [
        'rule_generation_progress',
        'rule_generation_complete',
        'rule_generation_error',
        'test_phase_update',
        'test_complete'
      ]

      const subscribeMessage: SubscribeRequest = {
        type: 'subscribe',
        workflowId: this.workflowId,
        subscribeTypes
      }

      this.ws.send(JSON.stringify(subscribeMessage))
    }
  }

  sendHeartbeat(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const heartbeat: HeartbeatRequest = {
        type: 'heartbeat',
        timestamp: Date.now()
      }
      this.ws.send(JSON.stringify(heartbeat))
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const websocketManager = new WebSocketManager()