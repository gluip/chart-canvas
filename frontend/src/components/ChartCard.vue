<template>
  <div class="chart-card">
    <div class="chart-header">
      <h3>{{ visualization.title || visualization.type }}</h3>
    </div>
    <div class="chart-body">
      <v-chart :option="chartOption" autoresize />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart, BarChart, ScatterChart } from "echarts/charts";
import { GridComponent, TooltipComponent, TitleComponent } from "echarts/components";
import VChart from "vue-echarts";
import type { VisualizationData } from "@/types/canvas";

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
]);

interface Props {
  visualization: VisualizationData;
}

const props = defineProps<Props>();

const chartOption = computed(() => {
  const xData = props.visualization.points.map((p) => p[0]);
  const yData = props.visualization.points.map((p) => p[1]);

  const baseOption = {
    tooltip: {
      trigger: "axis",
    },
    grid: {
      left: "10%",
      right: "5%",
      bottom: "15%",
      top: "10%",
    },
    xAxis: {
      type: "category",
      data: xData,
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        data: yData,
        type: props.visualization.type === "scatter" ? "scatter" : props.visualization.type,
      },
    ],
  };

  return baseOption;
});
</script>

<style scoped>
.chart-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chart-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e8e8e8;
}

.chart-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  text-transform: capitalize;
}

.chart-body {
  flex: 1;
  padding: 10px;
  min-height: 0;
}
</style>
