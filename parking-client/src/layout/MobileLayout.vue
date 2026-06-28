<script setup lang="ts">
import BottomNav from './BottomNav.vue'
</script>

<template>
  <div class="mobile-layout">
    <router-view />
    <BottomNav />
  </div>
</template>

<style scoped>
.mobile-layout {
  min-height: 100vh;
  padding-bottom: 0;
}
</style>
