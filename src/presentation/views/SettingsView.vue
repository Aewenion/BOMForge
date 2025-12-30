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

      <section class="settings-section">
        <h3>{{ $t('settings.pwa') }}</h3>
        <div class="info-row">
          <span class="info-label">{{ $t('settings.offlineMode') }}:</span>
          <span class="info-value">{{ isOnline ? $t('settings.online') : $t('settings.offline') }}</span>
        </div>
        <div v-if="updateAvailable" class="update-banner">
          <p>{{ $t('settings.updateAvailable') }}</p>
          <button class="btn-primary" @click="updateApp">
            {{ $t('settings.updateNow') }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const appVersion = ref('0.1.0')
const buildDate = ref('')
const storageUsed = ref(0)
const storageQuota = ref(0)
const storageUsagePercent = ref(0)
const isLoading = ref(false)
const isOnline = ref(navigator.onLine)
const updateAvailable = ref(false)

// Get app version from Vite define
onMounted(async () => {
  // Version injected at build time from package.json
  appVersion.value = import.meta.env.__APP_VERSION__ || '0.1.0'
  
  buildDate.value = new Date().toLocaleDateString('fa-IR')
  await refreshStorage()
  checkForUpdates()
  
  // Listen for online/offline events
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // Listen for service worker updates
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', checkForUpdates)
  }
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})

function handleOnline() {
  isOnline.value = true
}

function handleOffline() {
  isOnline.value = false
}

async function refreshStorage() {
  isLoading.value = true
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      storageUsed.value = estimate.usage || 0
      storageQuota.value = estimate.quota || 0
      storageUsagePercent.value = storageQuota.value > 0 
        ? Math.round((storageUsed.value / storageQuota.value) * 100) 
        : 0
    } else {
      // Fallback for browsers that don't support storage estimate
      storageUsed.value = 0
      storageQuota.value = 0
      storageUsagePercent.value = 0
    }
  } catch (error) {
    console.error('Error getting storage estimate:', error)
  } finally {
    isLoading.value = false
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        registration.addEventListener('updatefound', () => {
          updateAvailable.value = true
        })
        registration.update()
      }
    })
  }
}

async function updateApp() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }
}
</script>

<style scoped>
.settings-view {
  display: grid;
  gap: 2rem;
}

.settings-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--glass-border);
}

.settings-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.settings-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  color: var(--primary);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: var(--text-main);
}

.info-value {
  color: var(--text-main);
  opacity: 0.8;
}

.storage-bar {
  width: 100%;
  height: 1rem;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  overflow: hidden;
  margin: 1rem 0;
}

.storage-bar-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.3s ease, background 0.3s ease;
}

.storage-bar-fill.storage-warning {
  background: #f59e0b;
}

.storage-bar-fill.storage-danger {
  background: #ef4444;
}

.btn-secondary {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-main);
  border: 1px solid var(--glass-border);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
  margin-top: 1rem;
  transition: background 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.1);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.update-banner {
  background: rgba(37, 99, 235, 0.1);
  border: 1px solid var(--primary);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
}

.update-banner p {
  margin: 0 0 0.75rem 0;
}

.update-banner .btn-primary {
  width: 100%;
}
</style>
