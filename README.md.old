# Chart Canvas - MCP Visualization Server

Een MCP server die LLMs de mogelijkheid biedt om visualisaties (grafieken) te tonen via een interactief dashboard.

## Architectuur

- **Backend (Node/TypeScript)**: MCP server + Express API
- **Frontend (Vue 3)**: Dashboard met drag-and-drop grid
- **Flow**: LLM → MCP tools → Backend state → Frontend polling → User

## Quick Start

### 1. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend draait op: http://localhost:5173

### 2. Configureer MCP Client

Voeg toe aan je MCP client configuratie (bijv. Claude Desktop). De MCP server start automatisch de backend:

```json
{
  "mcpServers": {
    "chart-canvas": {
      "command": "node",
      "args": ["/Users/martijn/Code/chat-canvas/backend/dist/index.js"]
    }
  }
}
```

Of voor development:

```json
{
  "mcpServers": {
    "chart-canvas": {
      "command": "npm",
      "args": [
        "--prefix",
        "/Users/martijn/Code/chat-canvas/backend",
        "run",
        "dev"
      ]
    }
  }
}
```

## MCP Tools

### addVisualization

Voeg een grafiek toe aan het canvas.

```typescript
addVisualization({
  type: 'line' | 'bar' | 'scatter',
  points: [[1, 2], [2, 3], [4, 0]],
  title?: 'Optional Title'
})
```

### removeVisualization

Verwijder een specifieke grafiek.

```typescript
removeVisualization({
  id: "visualization-id",
});
```

### clearCanvas

Verwijder alle visualisaties.

```typescript
clearCanvas();
```

## Voorbeeld Prompts

- "Teken een grafiek met punten 1,2; 2,3; 4,0"
- "Maak een bar chart met data: 1,5; 2,8; 3,3; 4,7"
- "Clear het canvas en toon een scatter plot met willekeurige punten"
