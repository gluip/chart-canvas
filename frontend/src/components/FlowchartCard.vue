<template>
  <div class="flowchart-card">
    <div class="card-header">
      <div>
        <div v-if="visualization.title" class="card-title">{{ visualization.title }}</div>
        <div v-if="visualization.description" class="card-description">
          {{ visualization.description }}
        </div>
      </div>
      <button @click="openInMermaidEditor" class="editor-button" title="Open in Mermaid Live Editor">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </button>
    </div>
    <div class="mermaid-container">
      <div ref="mermaidEl" class="mermaid-diagram"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import mermaid from "mermaid";
import type { VisualizationData } from "@/types/canvas";

interface Props {
  visualization: VisualizationData;
}

const props = defineProps<Props>();
const mermaidEl = ref<HTMLElement | null>(null);

const openInMermaidEditor = () => {
  if (!props.visualization.mermaid) return;
  
  // Encode Mermaid syntax to base64 for Mermaid Live Editor
  const encoded = btoa(JSON.stringify({
    code: props.visualization.mermaid,
    mermaid: { theme: 'default' }
  }));
  
  // Open in Mermaid Live Editor
  const url = `https://mermaid.live/edit#base64:${encoded}`;
  window.open(url, '_blank');
};

// Initialize mermaid with custom theme
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  themeVariables: {
    primaryColor: "#5b8ff9",
    primaryTextColor: "#fff",
    primaryBorderColor: "#4a7ed6",
    lineColor: "#666",
    secondaryColor: "#91d5ff",
    tertiaryColor: "#f5f5f5",
    fontSize: "14px",
  },
});

const renderDiagram = async () => {
  if (!mermaidEl.value || !props.visualization.mermaid) return;

  try {
    const id = `mermaid-${props.visualization.id}`;
    const { svg } = await mermaid.render(id, props.visualization.mermaid);
    mermaidEl.value.innerHTML = svg;
  } catch (error) {
    console.error("Mermaid rendering error:", error);
    mermaidEl.value.innerHTML = `<div class="error">Fout bij renderen flowchart</div>`;
  }
};

onMounted(() => {
  renderDiagram();
});

watch(
  () => props.visualization.mermaid,
  () => {
    renderDiagram();
  },
);
</script>

<style scoped>
.flowchart-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.card-description {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.editor-button {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.editor-button:hover {
  background: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.editor-button:active {
  transform: translateY(0);
}

.mermaid-container {
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  min-height: 0;
}

.mermaid-diagram {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mermaid-diagram :deep(svg) {
  max-width: 100%;
  max-height: 100%;
  height: auto;
  width: auto;
}

.error {
  color: #ff4d4f;
  padding: 16px;
  text-align: center;
  font-size: 14px;
}
</style>
