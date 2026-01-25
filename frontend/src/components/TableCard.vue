<template>
  <div class="table-card">
    <div class="card-header">
      <div class="header-text">
        <div v-if="visualization.title" class="card-title">{{ visualization.title }}</div>
        <div v-if="visualization.description" class="card-description">
          {{ visualization.description }}
        </div>
      </div>
      <div class="export-buttons">
        <button @click="copyToClipboard" class="export-btn" title="Copy to clipboard">
          📋
        </button>
        <button @click="downloadCSV" class="export-btn" title="Download as CSV">
          ⬇️ CSV
        </button>
      </div>
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

function tableToCSV(): string {
  if (!props.visualization.table) return "";

  const { headers, rows } = props.visualization.table;
  
  // Escape CSV values
  const escape = (value: any) => {
    const str = String(value ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Create CSV
  const headerRow = headers.map(escape).join(",");
  const dataRows = rows.map((row) => row.map(escape).join(","));

  return [headerRow, ...dataRows].join("\n");
}

async function copyToClipboard() {
  const csv = tableToCSV();
  try {
    await navigator.clipboard.writeText(csv);
    alert("Table copied to clipboard!");
  } catch (err) {
    console.error("Failed to copy:", err);
    alert("Failed to copy to clipboard");
  }
}

function downloadCSV() {
  const csv = tableToCSV();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${props.visualization.title || "table"}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.header-text {
  flex: 1;
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
}

.export-buttons {
  display: flex;
  gap: 8px;
}

.export-btn {
  padding: 6px 12px;
  font-size: 12px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn:hover {
  background: #e8e8e8;
  border-color: #d0d0d0;
}

.export-btn:active {
  transform: translateY(1px);
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
