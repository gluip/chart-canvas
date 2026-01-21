<template>
  <div class="table-card">
    <div v-if="visualization.title" class="card-title">{{ visualization.title }}</div>
    <div v-if="visualization.description" class="card-description">
      {{ visualization.description }}
    </div>
    <div class="table-container">
      <table v-if="visualization.table">
        <thead>
          <tr>
            <th v-for="(header, idx) in visualization.table.headers" :key="idx">
              {{ header }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIdx) in visualization.table.rows" :key="rowIdx">
            <td v-for="(cell, cellIdx) in row" :key="cellIdx">
              {{ cell }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VisualizationData } from "@/types/canvas";

interface Props {
  visualization: VisualizationData;
}

const props = defineProps<Props>();
</script>

<style scoped>
.table-card {
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

.table-container {
  flex: 1;
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

thead {
  position: sticky;
  top: 0;
  background: #f5f5f5;
  z-index: 1;
}

th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
}

td {
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
  color: #555;
}

tbody tr:hover {
  background-color: #fafafa;
}

tbody tr:last-child td {
  border-bottom: none;
}
</style>
