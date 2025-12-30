<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container" dir="rtl">
    <header class="app-header">
      <div class="logo">
        <h1>BOMForge</h1>
        <span class="subtitle">سیستم مدیریت فرمولاسیون</span>
      </div>
      <nav class="main-nav">
        <router-link to="/">داشبورد</router-link>
        <router-link to="/materials">مواد اولیه</router-link>
        <router-link to="/products">محصولات</router-link>
        <router-link to="/gallery">گالری محصولات</router-link>
        <router-link to="/bom-editor">ویرایشگر فرمول</router-link>
        <router-link to="/calculator">ماشین حساب تولید</router-link>
        <router-link to="/settings">تنظیمات</router-link>
        <router-link to="/database-test">تست دیتابیس</router-link>
      </nav>
    </header>

    <main class="app-content">
      <RouterView />
    </main>
  </div>
</template>

<style>
:root {
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --bg-main: #f8fafc;
  --text-main: #1e293b;
  --white: #ffffff;
  --glass: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(255, 255, 255, 0.3);
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: var(--primary);
  color: var(--white);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.logo h1 {
  margin: 0;
  font-size: 1.5rem;
  letter-spacing: 1px;
}

.subtitle {
  font-size: 0.8rem;
  opacity: 0.8;
}

.main-nav {
  display: flex;
  gap: 1.5rem;
}

.main-nav a {
  color: var(--white);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: background 0.2s;
}

.main-nav a:hover, .main-nav a.router-link-active {
  background: rgba(255, 255, 255, 0.2);
}

.app-content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}
</style>
