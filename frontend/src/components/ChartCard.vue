<template>
  <div class="chart-card">
    <div class="chart-header">
      <h3>{{ visualization.title || visualization.type }}</h3>
      <p v-if="visualization.description" class="description">{{ visualization.description }}</p>
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
import { LineChart, BarChart, ScatterChart, PieChart } from "echarts/charts";
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from "echarts/components";
import VChart from "vue-echarts";
import type { VisualizationData } from "@/types/canvas";

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  ScatterChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
]);

interface Props {
  visualization: VisualizationData;
}

const props = defineProps<Props>();

const chartOption = computed(() => {
  // Pie chart has different structure
  if (props.visualization.type === "pie") {
    return {
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b}: {c} ({d}%)",
      },
      legend: {
        orient: "vertical",
        left: "left",
      },
      series: [
        {
          name: props.visualization.title || "Data",
          type: "pie",
          radius: "65%",
          center: ["50%", "55%"],
          data: props.visualization.series?.[0]?.data.map((p) => ({
            name: props.visualization.xLabels?.[p[0]] || `Item ${p[0]}`,
            value: p[1],
          })) || [],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };
  }

  // Regular charts (line, bar, scatter)
  // Use xLabels or generate from first series data
  const xData = props.visualization.xLabels || props.visualization.series?.[0]?.data.map((p) => p[0]) || [];

  // Map series to ECharts format
  const seriesData = props.visualization.series?.map((s) => ({
    name: s.name,
    type: props.visualization.type === "scatter" ? "scatter" : props.visualization.type,
    data: s.data.map((p) => p[1]),
  }));

  const baseOption = {
    tooltip: {
      trigger: "axis",
    },
    legend: {
      data: props.visualization.series?.map((s) => s.name) || [],
      top: 0,
    },
    grid: {
      left: "10%",
      right: "5%",
      bottom: "15%",
      top: (props.visualization.series?.length || 0) > 1 ? "15%" : "10%",
    },
    xAxis: {
      type: "category",
      data: xData,
    },
    yAxis: {
      type: "value",
    },
    series: seriesData,
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
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  text-transform: capitalize;
}

.chart-header .description {
  margin: 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.chart-body {
  flex: 1;
  padding: 10px;
  min-height: 0;
}
</style>
