#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { stateManager } from "./state.js";
import { startApiServer } from "./api.js";
import open from "open";

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
              enum: ["line", "bar", "scatter", "table", "flowchart", "pie"],
              description: "Type of visualization to create",
            },
            series: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description:
                      "Name of the series (e.g., '2015', 'Product A')",
                  },
                  data: {
                    type: "array",
                    items: {
                      type: "array",
                      items: { type: "number" },
                      minItems: 2,
                      maxItems: 2,
                    },
                    description:
                      "Array of [x, y] coordinate pairs for this series",
                  },
                },
                required: ["name", "data"],
              },
              description:
                "Array of data series to display (required for charts)",
            },
            table: {
              type: "object",
              properties: {
                headers: {
                  type: "array",
                  items: { type: "string" },
                  description: "Column headers for the table",
                },
                rows: {
                  type: "array",
                  items: {
                    type: "array",
                    items: { type: ["string", "number"] },
                  },
                  description: "Table rows, each row is an array of values",
                },
              },
              required: ["headers", "rows"],
              description: "Table data (required for table type)",
            },
            mermaid: {
              type: "string",
              description:
                "Mermaid diagram syntax (required for flowchart type)",
            },
            title: {
              type: "string",
              description: "Optional title for the chart",
            },
            description: {
              type: "string",
              description: "Optional description or explanation for the chart",
            },
            xLabels: {
              type: "array",
              items: { type: "string" },
              description:
                "Optional labels for the x-axis (e.g., dates). Should match the number of data points.",
            },
          },
          required: ["type"],
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
      {
        name: "showCanvas",
        description:
          "Open the canvas in a browser window to view visualizations",
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
      const { type, series, table, mermaid, title, description, xLabels } =
        args as {
          type: "line" | "bar" | "scatter" | "table" | "flowchart" | "pie";
          series?: { name: string; data: [number, number][] }[];
          table?: { headers: string[]; rows: (string | number)[][] };
          mermaid?: string;
          title?: string;
          description?: string;
          xLabels?: string[];
        };

      const viz = stateManager.addVisualization({
        type,
        series,
        table,
        mermaid,
        title,
        description,
        xLabels,
      });

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

    case "showCanvas": {
      try {
        await open("http://localhost:3000");
        return {
          content: [
            {
              type: "text",
              text: "Opened canvas in browser at http://localhost:3000",
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to open browser: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
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
