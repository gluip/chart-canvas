import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { stateManager } from "./state.js";
import { startApiServer } from "./api.js";

const server = new Server(
  {
    name: "chart-canvas-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "addVisualization",
        description: "Add a new chart visualization to the canvas",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["line", "bar", "scatter"],
              description: "Type of chart to create",
            },
            points: {
              type: "array",
              items: {
                type: "array",
                items: { type: "number" },
                minItems: 2,
                maxItems: 2,
              },
              description: "Array of [x, y] coordinate pairs",
            },
            title: {
              type: "string",
              description: "Optional title for the chart",
            },
            description: {
              type: "string",
              description: "Optional description or explanation for the chart",
            },
          },
          required: ["type", "points"],
        },
      },
      {
        name: "removeVisualization",
        description: "Remove a visualization from the canvas by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "ID of the visualization to remove",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "clearCanvas",
        description: "Remove all visualizations from the canvas",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "addVisualization": {
      const { type, points, title, description } = args as {
        type: "line" | "bar" | "scatter";
        points: [number, number][];
        title?: string;
        description?: string;
      };

      const viz = stateManager.addVisualization({ type, points, title, description });

      return {
        content: [
          {
            type: "text",
            text: `Added ${type} chart with ID ${viz.id}. View it at http://localhost:3000`,
          },
        ],
      };
    }

    case "removeVisualization": {
      const { id } = args as { id: string };
      const removed = stateManager.removeVisualization(id);

      return {
        content: [
          {
            type: "text",
            text: removed
              ? `Removed visualization ${id}`
              : `Visualization ${id} not found`,
          },
        ],
      };
    }

    case "clearCanvas": {
      stateManager.clearCanvas();

      return {
        content: [
          {
            type: "text",
            text: "Cleared all visualizations from canvas",
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  // Start the API server for frontend
  startApiServer();

  // Start MCP server on stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Chart Canvas MCP Server running");
  console.error("API server running on http://localhost:3000");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
