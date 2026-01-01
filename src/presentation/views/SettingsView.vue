<template>
  <div class="settings-view">
    <div class="glass-card">
      <h2>{{ $t('settings.title') }}</h2>
      
      <section class="settings-section">
        <h3>{{ $t('settings.appInfo') }}</h3>
        <div class="info-row">
          <span class="label">{{ $t('settings.appName') }}:</span>
          <span class="value">BOMForge</span>
        </div>
        <div class="info-row">
          <span class="label">{{ $t('settings.appVersion') }}:</span>
          <span class="value">{{ appVersion }}</span>
        </div>
        <div class="info-row">
          <span class="label">{{ $t('settings.buildDate') }}:</span>
          <span class="value">{{ buildDate }}</span>
        </div>
      </section>

      <section class="settings-section">
        <h3>{{ $t('settings.storage') }}</h3>
        <div class="info-row">
          <span class="label">{{ $t('settings.storageUsed') }}:</span>
          <span class="value">{{ formatBytes(storageUsed) }}</span>
        </div>
        <div class="info-row">
          <span class="label">{{ $t('settings.storageQuota') }}:</span>
          <span class="value">{{ formatBytes(storageQuota) }}</span>
        </div>
        <div class="info-row">
          <span class="label">{{ $t('settings.storageUsage') }}:</span>
          <span class="value">{{ storageUsagePercent }}%</span>
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
          <span class="label">{{ $t('settings.offlineMode') }}:</span>
          <span class="value" :class="isOnline ? 'text-success' : 'text-danger'">
            {{ isOnline ? $t('settings.online') : $t('settings.offline') }}
          </span>
        </div>
        <div v-if="updateAvailable" class="update-banner">
          <p>{{ $t('settings.updateAvailable') }}</p>
          <button class="btn-primary btn-sm" @click="updateApp">
            {{ $t('settings.updateNow') }}
          </button>
        </div>
      </section>

      <section class="settings-section">
        <h3>{{ $t('settings.backupRestore') }}</h3>
        <div class="backup-actions">
          <button 
            class="btn-primary" 
            @click="handleExport"
            :disabled="isExporting"
          >
            {{ isExporting ? $t('settings.exporting') : $t('settings.exportBackup') }}
          </button>
          
          <div class="import-container">
            <button 
              class="btn-secondary" 
              @click="triggerFileInput"
              :disabled="isImporting"
            >
              {{ isImporting ? $t('settings.importing') : $t('settings.importBackup') }}
            </button>
            <input 
              ref="fileInput"
              type="file" 
              accept=".json" 
              style="display: none" 
              @change="handleImport"
            />
          </div>
        </div>
        
        <div v-if="importResult" class="import-result" :class="{ 'result-success': importResult.success, 'result-error': !importResult.success }">
          {{ importResult.message }}
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { exportDatabaseUseCase } from '../../application/useCases/ExportDatabase'
import { importDatabaseUseCase } from '../../application/useCases/ImportDatabase'
import { downloadExport, readImportFile, type ExportData } from '../../infrastructure/utils/exportImport'

const { t } = useI18n()

// PWA Update Logic
const updateAvailable = ref(false)
const registration = ref<ServiceWorkerRegistration | null>(null)

const onServiceWorkerUpdate = (reg: ServiceWorkerRegistration) => {
  registration.value = reg
  updateAvailable.value = true
}

const updateApp = () => {
  if (registration.value && registration.value.waiting) {
    registration.value.waiting.postMessage({ type: 'SKIP_WAITING' })
    window.location.reload()
  }
}

// App Info
const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.1.0'
const buildDate = new Date().toLocaleDateString('fa-IR')

// Storage
const storageUsed = ref<number>(0)
const storageQuota = ref<number>(0)
const isLoading = ref<boolean>(false)

// Online/Offline
const isOnline = ref(navigator.onLine)
const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
}

// Export/Import
const isExporting = ref(false)
const isImporting = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const importResult = ref<{ success: boolean; message: string } | null>(null)

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

const handleExport = async () => {
  isExporting.value = true
  try {
    const output = await exportDatabaseUseCase({ includeBlobs: true })
    const data = JSON.parse(output.data) as ExportData
    downloadExport(data, `bomforge-backup-${new Date().toISOString().split('T')[0]}.json`)
  } catch (error) {
    console.error('Export failed:', error)
    alert(t('settings.exportError'))
  } finally {
    isExporting.value = false
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleImport = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  isImporting.value = true
  importResult.value = null
  
  try {
    const data = await readImportFile(file)
    const result = await importDatabaseUseCase({
      data: JSON.stringify(data),
      merge: false // Default to overwrite for now as per summary
    })
    
    if (result.imported.success) {
      importResult.value = {
        success: true,
        message: t('settings.importSuccess', {
          materials: result.imported.materials,
          products: result.imported.products,
          bomVersions: result.imported.bomVersions
        })
      }
      // Reload page after a delay to reflect changes
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } else {
      importResult.value = {
        success: false,
        message: t('settings.importError') + ': ' + result.errors.join(', ')
      }
    }
  } catch (error) {
    console.error('Import failed:', error)
    importResult.value = {
      success: false,
      message: t('settings.importError')
    }
  } finally {
    isImporting.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

onMounted(() => {
  refreshStorage()
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  
  // Listen for PWA updates
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) {
        reg.addEventListener('updatefound', () => {
          onServiceWorkerUpdate(reg)
        })
        if (reg.waiting) {
          onServiceWorkerUpdate(reg)
        }
      }
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<style scoped>
.settings-view {
  display: grid;
  gap: 2rem;
}

/* .glass-card moved to global */

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

/* .info-row, .info-label, .info-value moved to global as .info-row, .label, .value */

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

/* .btn-secondary, .text-success, etc moved to global */

.update-banner {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(37, 99, 235, 0.2);
  border: 1px solid var(--primary);
  border-radius: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.update-banner p {
  margin: 0;
}

/* .btn-sm moved to global */

.backup-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

/* .btn-primary moved to global */

.import-result {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 0.4rem;
  font-size: 0.9rem;
}

.result-success {
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid #4ade80;
  color: #4ade80;
}

.result-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  color: #ef4444;
}
</style>

