<template>
  <div class="dashboard-view">
    <div class="glass-card">
      <h2>{{ $t('dashboard.title') }}</h2>
      <p>{{ $t('dashboard.welcome') }}</p>
    </div>
  </div>
</template>

<style scoped>
.dashboard-view {
  display: grid;
  gap: 2rem;
}
</style>
