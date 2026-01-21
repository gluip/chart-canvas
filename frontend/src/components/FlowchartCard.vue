<template>
  <div class="flowchart-card">
    <div v-if="visualization.title" class="card-title">{{ visualization.title }}</div>
    <div v-if="visualization.description" class="card-description">
      {{ visualization.description }}
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

watch(() => props.visualization.mermaid, () => {
  renderDiagram();
});
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

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.card-description {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
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
