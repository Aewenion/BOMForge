<template>
  <div class="materials-view">
    <div class="glass-card">
      <h2>{{ $t('materials.title') }}</h2>
      <button class="btn-primary">{{ $t('materials.addNew') }}</button>
    </div>
  </div>
</template>

<style scoped>
.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
}

.btn-primary:hover {
  background: var(--primary-hover);
}
</style>
