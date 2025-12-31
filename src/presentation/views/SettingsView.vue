<template>
  <div class="settings-view">
    <div class="glass-card">
      <h2>{{ $t('settings.title') }}</h2>
      
      <section class="settings-section">
        <h3>{{ $t('settings.appInfo') }}</h3>
        <div class="info-row">
          <span class="info-label">{{ $t('settings.appName') }}:</span>
          <span class="info-value">BOMForge</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ $t('settings.appVersion') }}:</span>
          <span class="info-value">{{ appVersion }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ $t('settings.buildDate') }}:</span>
          <span class="info-value">{{ buildDate }}</span>
        </div>
      </section>

      <section class="settings-section">
        <h3>{{ $t('settings.storage') }}</h3>
        <div class="info-row">
          <span class="info-label">{{ $t('settings.storageUsed') }}:</span>
          <span class="info-value">{{ formatBytes(storageUsed) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ $t('settings.storageQuota') }}:</span>
          <span class="info-value">{{ formatBytes(storageQuota) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ $t('settings.storageUsage') }}:</span>
          <span class="info-value">{{ storageUsagePercent }}%</span>
        </div>
        <div class="storage-bar">
          <div 
            class="storage-bar-fill" 
            :style="{ width: storageUsagePercent + '%' }"
            :class="{ 'storage-warning': storageUsagePercent > 80, 'storage-danger': storageUsagePercent > 90 }"
          ></div>
        </div>
        <button 
          class="btn-secondary" 
          @click="refreshStorage"
          :disabled="isLoading"
        >
          {{ $t('settings.refresh') }}
        </button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const appVersion = import.meta.env.__APP_VERSION__ || '0.1.0'
const buildDate = new Date().toLocaleDateString('fa-IR')

const storageUsed = ref<number>(0)
const storageQuota = ref<number>(0)
const isLoading = ref<boolean>(false)

const storageUsagePercent = computed(() => {
  if (storageQuota.value === 0) return 0
  return Math.round((storageUsed.value / storageQuota.value) * 100)
})

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const refreshStorage = async () => {
  isLoading.value = true
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      storageUsed.value = estimate.usage || 0
      storageQuota.value = estimate.quota || 0
    }
  } catch (error) {
    console.error('Error getting storage estimate:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  refreshStorage()
})
</script>

<style scoped>
.settings-view {
  display: grid;
  gap: 2rem;
}

.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.settings-section {
  margin-top: 2rem;
}

.settings-section:first-of-type {
  margin-top: 0;
}

.settings-section h3 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: rgba(255, 255, 255, 0.7);
}

.info-value {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.storage-bar {
  width: 100%;
  height: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  overflow: hidden;
  margin: 1rem 0;
}

.storage-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ade80, #22c55e);
  transition: width 0.3s ease;
}

.storage-bar-fill.storage-warning {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

.storage-bar-fill.storage-danger {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.btn-secondary {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

