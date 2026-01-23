<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import GridCanvas from "./components/GridCanvas.vue";
import { pollCanvasState } from "./services/api";
import type { VisualizationData } from "./types/canvas";

const visualizations = ref<VisualizationData[]>([]);

let stopPolling: (() => void) | null = null;

onMounted(() => {
  stopPolling = pollCanvasState((state) => {
    visualizations.value = state.visualizations;
  });
});

// Update page title based on first visualization
watch(
  () => visualizations.value,
  (newViz) => {
    if (newViz.length > 0 && newViz[0].title) {
      document.title = newViz[0].title;
    } else {
      document.title = "chat-canvas";
    }
  },
  { deep: true },
);

onUnmounted(() => {
  if (stopPolling) stopPolling();
});
</script>

<template>
  <div class="app">
    <div v-if="visualizations.length === 0" class="empty-state">
      <h2>No visualizations yet</h2>
      <p>Use the MCP tools to add charts to the canvas</p>
    </div>
    <GridCanvas v-else :visualizations="visualizations" />
  </div>
</template>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  overflow: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.empty-state h2 {
  margin-bottom: 8px;
  color: #333;
}

.empty-state p {
  font-size: 14px;
}
</style>
