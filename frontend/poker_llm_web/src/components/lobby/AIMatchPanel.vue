<template>
  <div class="panel-container">
    <div class="panel-card ai-panel-card">
      <div class="panel-header">
        <h2>Host AI Match</h2>
          <span class="beta-badge">BYOK</span>
      </div>

      <div class="form-content">
        <!-- Step 1: Basic Info -->
        <div class="form-group">
          <label>Display Name</label>
          <el-input v-model="displayName" placeholder="Enter your name" class="panel-input" />
        </div>

        <div class="form-group">
          <label>AI Provider</label>
          <el-select v-model="aiProvider" placeholder="Select Provider" class="panel-input full-width" @change="onProviderChange">
            <el-option label="OpenAI" value="openai" />
            <el-option label="DeepSeek" value="deepseek" />
            <el-option label="OpenRouter" value="openrouter" />
            <el-option label="Qwen" value="qwen" />
            <el-option label="Gemini" value="gemini" />
            <el-option label="Custom (OpenAI-compatible)" value="custom" />
          </el-select>
        </div>

        <!-- Step 2: API Key (Revealed only if Provider selected) -->
        <transition name="slide-fade">
          <div v-if="aiProvider" class="step-container">
            <div class="form-group">
              <label>{{ apiKeyLabel }}</label>
              <el-input 
                v-model="aiKey" 
                type="password" 
                :placeholder="apiKeyPlaceholder" 
                show-password 
                class="panel-input" 
                @input="invalidateConnection" 
              />
            </div>
            
            <!-- Step 3: Advanced Config Toggle -->
            <div class="advanced-toggle" @click="showAdvanced = !showAdvanced">
              <span class="toggle-text">
                <el-icon><Setting /></el-icon>
                {{ showAdvanced ? 'Hide details' : 'Connection details' }}
              </span>
              <el-icon :class="{ 'rotated': showAdvanced }"><CaretRight /></el-icon>
            </div>

            <!-- Step 3.5: Advanced Config Form -->
            <el-collapse-transition>
              <div v-show="showAdvanced" class="advanced-config">
                <div class="form-group">
                  <label>Model</label>
                  <el-input v-model="aiModel" :placeholder="modelPlaceholder" class="panel-input" @input="invalidateConnection" />
                </div>
                
                <div class="form-group">
                  <label>Base URL / Endpoint {{ aiProvider === 'custom' ? '(Required)' : '(Optional)' }}</label>
                  <el-input
                    v-model="aiBaseUrl"
                    :placeholder="defaultBaseUrlHint"
                    class="panel-input"
                    @input="invalidateConnection"
                  >
                    <template #prefix><span class="url-prefix-icon">🔗</span></template>
                  </el-input>
                  <p class="field-hint">
                    {{ aiProvider === 'custom' ? 'Full completions endpoint URL' : 'Leave blank to use official API' }}
                  </p>
                </div>
              </div>
            </el-collapse-transition>
          </div>
        </transition>

        <!-- Step 4: Verification & Action -->
        <transition name="slide-fade">
          <div v-if="aiProvider && aiKey" class="action-section">
            <div class="status-indicator" v-if="validationState.status !== 'idle'">
              <el-alert
                v-if="validationState.status === 'success'"
                title="Connection Verified"
                type="success"
                show-icon
                :closable="false"
              />
              <el-alert
                v-else-if="validationState.status === 'error'"
                :title="validationState.errorMessage || 'Connection Failed'"
                type="error"
                show-icon
                :closable="false"
              />
            </div>

            <div class="button-group">
              <el-button 
                type="info" 
                plain 
                class="test-btn"
                @click="handleTestConnection" 
                :loading="validationState.status === 'testing'"
                :disabled="!canTest"
              >
                Test Connection
              </el-button>
              
              <el-button 
                type="success" 
                class="start-btn panel-btn"
                @click="handleStartMatch" 
                :loading="startingMatch" 
                :disabled="validationState.status !== 'success'"
              >
                Start Match
              </el-button>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOnlineStore } from '@/stores/online'
import { ElMessage } from 'element-plus'
import { Setting, CaretRight } from '@element-plus/icons-vue'

const router = useRouter()
const onlineStore = useOnlineStore()

// State
const displayName = ref('Player 1')
const aiProvider = ref('')
const aiModel = ref('')
const aiKey = ref('')
const aiBaseUrl = ref('')

const showAdvanced = ref(false)
const startingMatch = ref(false)
const validationState = ref({
  status: 'idle', // 'idle' | 'testing' | 'success' | 'error'
  errorMessage: null
})

// Load cached config on mount
onMounted(() => {
  displayName.value = localStorage.getItem('poker_hva_name') || 'Player 1'
  const cachedConfig = localStorage.getItem('poker_ai_config')
  if (cachedConfig) {
    try {
      const parsed = JSON.parse(cachedConfig)
      aiProvider.value = parsed.provider || ''
      aiModel.value = parsed.model || ''
      // Never cache API key for security reasons, or decide based on security policy.
      // Given BYOK, we'll cache it in localStorage for convenience, as it's a frontend-only app.
      aiKey.value = parsed.apiKey || '' 
      aiBaseUrl.value = parsed.baseUrl || ''
      
      if (aiProvider.value === 'custom') {
        showAdvanced.value = true
      }
    } catch (e) {
      console.error("Failed to parse cached AI config")
    }
  }
})

// Computed placeholders
const apiKeyLabel = computed(() => aiProvider.value === 'gemini' ? 'Gemini API Key' : 'API Key')
const apiKeyPlaceholder = computed(() => `Enter your ${aiProvider.value} API key`)

const modelPlaceholder = computed(() => {
  const hints = {
    openai: 'e.g. gpt-4o',
    deepseek: 'e.g. deepseek-chat',
    openrouter: 'e.g. openai/gpt-4o',
    qwen: 'e.g. qwen-plus',
    gemini: 'e.g. gemini-1.5-flash',
    custom: 'Model name'
  }
  return hints[aiProvider.value] || 'Model name'
})

const defaultBaseUrlHint = computed(() => {
  const defaults = {
    openai: 'https://api.openai.com/v1/chat/completions',
    deepseek: 'https://api.deepseek.com/chat/completions',
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'
  }
  return defaults[aiProvider.value] || 'Custom endpoint URL'
})

const canTest = computed(() => {
  const baseOk = aiProvider.value && aiModel.value && aiKey.value
  if (aiProvider.value === 'custom') return baseOk && aiBaseUrl.value
  return baseOk
})

// Actions
const invalidateConnection = () => {
  if (validationState.value.status === 'success') {
    validationState.value.status = 'idle'
  }
}

const onProviderChange = () => {
  invalidateConnection()
  aiBaseUrl.value = ''
  
  // Set default model when switching providers to make it easier
  const defaultModels = {
    openai: 'gpt-4o-mini',
    deepseek: 'deepseek-chat',
    openrouter: 'openai/gpt-4o-mini',
    qwen: 'qwen-plus',
    gemini: 'gemini-1.5-flash'
  }
  
  if (aiProvider.value !== 'custom') {
    aiModel.value = defaultModels[aiProvider.value] || ''
    showAdvanced.value = false
  } else {
    aiModel.value = ''
    showAdvanced.value = true
  }
}

const cacheConfig = () => {
  localStorage.setItem('poker_hva_name', displayName.value)
  localStorage.setItem('poker_ai_config', JSON.stringify({
    provider: aiProvider.value,
    model: aiModel.value,
    apiKey: aiKey.value,
    baseUrl: aiBaseUrl.value
  }))
}

const handleTestConnection = async () => {
  validationState.value = { status: 'testing', errorMessage: null }
  
  // Save locally right away when testing
  cacheConfig()
  
  try {
    const body = {
      provider_name: aiProvider.value,
      model: aiModel.value,
      api_key: aiKey.value
    }
    if (aiBaseUrl.value) body.base_url = aiBaseUrl.value

    const res = await fetch('/api/ai/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok || !data.ok) {
      throw new Error(data.message || 'Connection failed')
    }
    validationState.value = { status: 'success', errorMessage: null }
  } catch (err) {
    validationState.value = { status: 'error', errorMessage: err.message }
  }
}

const handleStartMatch = async () => {
  if (!displayName.value) return ElMessage.warning("Display name is required")
  if (validationState.value.status !== 'success') return ElMessage.warning("Please test connection first")
  
  startingMatch.value = true
  cacheConfig()
  
  try {
    const aiConfig = {
      provider_name: aiProvider.value,
      model: aiModel.value,
      api_key: aiKey.value
    }
    if (aiBaseUrl.value) aiConfig.base_url = aiBaseUrl.value
    
    const roomId = await onlineStore.createRoom('human_vs_ai', displayName.value, aiConfig)
    
    // Clear API key from state for security after passing it
    aiKey.value = ''
    validationState.value.status = 'idle'
    
    router.replace(`/room/${roomId}`)
  } catch (err) {
    ElMessage.error(err.message || 'Failed to create room')
    startingMatch.value = false
  }
}
</script>

<style scoped>
.panel-container {
  display: flex;
  justify-content: center;
  width: 100%;
}

.panel-card {
  width: 100%;
  max-width: 480px;
  background: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(18px);
}

.ai-panel-card {
  border-top: 3px solid var(--accent-ai);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.4rem;
  color: var(--text-primary);
  font-weight: 820;
}

.beta-badge {
  font-size: 0.75rem;
  background: rgba(217, 173, 88, 0.12);
  color: var(--accent-turn);
  padding: 0.2rem 0.55rem;
  border-radius: var(--radius-pill);
  font-weight: 850;
  border: 1px solid rgba(217, 173, 88, 0.26);
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 750;
}

.full-width {
  width: 100%;
}

.step-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--border-subtle);
}

.advanced-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: var(--bg-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.advanced-toggle:hover {
  background: rgba(255, 255, 255, 0.08);
}

.toggle-text {
  font-size: 0.85rem;
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.advanced-toggle .el-icon {
  color: var(--text-secondary);
  transition: transform 0.3s ease;
}

.advanced-toggle .el-icon.rotated {
  transform: rotate(90deg);
}

.advanced-config {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1rem;
  background: rgba(0,0,0,0.18);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.field-hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  padding-left: 2px;
}

.action-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-subtle);
}

.status-indicator :deep(.el-alert) {
  background-color: transparent;
  border: 1px solid currentColor;
  padding: 0.5rem 1rem;
}

.status-indicator :deep(.el-alert--success) {
  color: var(--success);
}

.status-indicator :deep(.el-alert--error) {
  color: var(--danger);
}

.button-group {
  display: flex;
  gap: 0.75rem;
}

.test-btn {
  flex: 1;
}

.start-btn {
  flex: 2;
  font-weight: 800;
  background-color: var(--accent-primary);
  border-color: var(--accent-primary);
  color: var(--text-inverse);
}

.start-btn:hover:not(:disabled) {
  background-color: var(--accent-primary-strong);
  border-color: var(--accent-primary-strong);
}

.start-btn:disabled {
  background-color: var(--bg-panel-raised);
  border-color: var(--border-subtle);
  color: var(--text-tertiary);
}

/* Animations */
.slide-fade-enter-active {
  transition: all 0.4s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
