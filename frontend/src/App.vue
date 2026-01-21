<script setup lang="ts">
import GridCanvas from './components/GridCanvas.vue'
import { mockCanvasState } from './data/mockCanvas'
</script>

<template>
  <div class="app">
    <GridCanvas :visualizations="mockCanvasState.visualizations" />
  </div>
</template>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
