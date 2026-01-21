<template>
  <div class="grid-canvas">
    <grid-layout
      v-model:layout="layout"
      :col-num="12"
      :row-height="60"
      :is-draggable="true"
      :is-resizable="true"
      :vertical-compact="true"
      :margin="[10, 10]"
      :use-css-transforms="true"
    >
      <grid-item
        v-for="item in layout"
        :key="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
      >
        <ChartCard :visualization="getVisualization(item.i)" />
      </grid-item>
    </grid-layout>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { GridLayout, GridItem } from "grid-layout-plus";
import ChartCard from "./ChartCard.vue";
import type { VisualizationData } from "@/types/canvas";

interface Props {
  visualizations: VisualizationData[];
}

const props = defineProps<Props>();

const layout = ref(
  props.visualizations.map((v) => ({
    x: v.x,
    y: v.y,
    w: v.w,
    h: v.h,
    i: v.id,
  })),
);

// Watch for changes in visualizations and update layout
watch(
  () => props.visualizations,
  (newViz) => {
    layout.value = newViz.map((v) => ({
      x: v.x,
      y: v.y,
      w: v.w,
      h: v.h,
      i: v.id,
    }));
  },
  { deep: true },
);

const getVisualization = (id: string) => {
  return props.visualizations.find((v) => v.id === id)!;
};
</script>

<style scoped>
.grid-canvas {
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  padding: 10px;
}
</style>
