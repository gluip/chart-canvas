#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { stateManager } from "./state.js";
import { startApiServer, getServerPort } from "./api.js";
import { getDatabaseSchema, executeQuery } from "./database.js";
import {
  transformToTable,
  transformToSeries,
  extractXLabels,
  type ColumnMapping,
} from "./transformers.js";
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
      {
        name: "getDatabaseSchema",
        description:
          "Get the schema of a SQLite database including all tables and columns. Use this to understand the database structure before writing queries.",
        inputSchema: {
          type: "object",
          properties: {
            databasePath: {
              type: "string",
              description:
                "Path to the SQLite database file (e.g., './data/atletiek.db' or '/absolute/path/to/db.sqlite')",
            },
          },
          required: ["databasePath"],
        },
      },
      {
        name: "queryAndVisualize",
        description:
          "Execute a SQL query on a SQLite database and create a visualization from the results. The query must be read-only (SELECT only). You must specify how to map columns to the visualization.",
        inputSchema: {
          type: "object",
          properties: {
            databasePath: {
              type: "string",
              description: "Path to the SQLite database file",
            },
            query: {
              type: "string",
              description:
                "SQL SELECT query to execute (read-only, max 10000 rows)",
            },
            visualizationType: {
              type: "string",
              enum: ["line", "bar", "scatter", "table", "pie"],
              description:
                "Type of visualization to create from the query results",
            },
            columnMapping: {
              type: "object",
              properties: {
                xColumn: {
                  type: "string",
                  description:
                    "Column to use for X-axis (required for charts, not needed for table)",
                },
                yColumns: {
                  type: "array",
                  items: { type: "string" },
                  description:
                    "Column(s) to use for Y-axis values (required for charts, not needed for table)",
                },
                seriesColumn: {
                  type: "string",
                  description:
                    "Optional: Column to group data into separate series (e.g., 'category', 'product_name')",
                },
                groupByColumn: {
                  type: "string",
                  description:
                    "Optional: Column to group by (alternative to seriesColumn)",
                },
              },
              description:
                "Mapping of query result columns to chart axes. Not required for table type.",
            },
            title: {
              type: "string",
              description: "Optional title for the visualization",
            },
            description: {
              type: "string",
              description: "Optional description for the visualization",
            },
            useColumnAsXLabel: {
              type: "boolean",
              description:
                "If true, use the xColumn values as labels instead of numeric values (useful for dates/categories)",
            },
          },
          required: ["databasePath", "query", "visualizationType"],
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

      const port = getServerPort() || 3000;
      return {
        content: [
          {
            type: "text",
            text: `Added ${type} chart with ID ${viz.id}. View it at http://localhost:${port}`,
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
        const port = getServerPort() || 3000;
        const url = `http://localhost:${port}`;
        await open(url);
        return {
          content: [
            {
              type: "text",
              text: `Opened canvas in browser at ${url}`,
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

    case "getDatabaseSchema": {
      try {
        const { databasePath } = args as { databasePath: string };
        const schema = getDatabaseSchema(databasePath);

        // Format schema as readable text
        let schemaText = `Database schema for: ${databasePath}\n\n`;

        for (const table of schema.tables) {
          schemaText += `Table: ${table.name}\n`;
          schemaText += `Columns:\n`;

          for (const col of table.columns) {
            const constraints = [];
            if (col.primaryKey) constraints.push("PRIMARY KEY");
            if (col.notNull) constraints.push("NOT NULL");
            if (col.defaultValue)
              constraints.push(`DEFAULT ${col.defaultValue}`);

            const constraintStr =
              constraints.length > 0 ? ` (${constraints.join(", ")})` : "";
            schemaText += `  - ${col.name}: ${col.type}${constraintStr}\n`;
          }
          schemaText += `\n`;
        }

        return {
          content: [
            {
              type: "text",
              text: schemaText,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting database schema: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }

    case "queryAndVisualize": {
      try {
        const {
          databasePath,
          query,
          visualizationType,
          columnMapping,
          title,
          description,
          useColumnAsXLabel,
        } = args as {
          databasePath: string;
          query: string;
          visualizationType: "line" | "bar" | "scatter" | "table" | "pie";
          columnMapping?: ColumnMapping;
          title?: string;
          description?: string;
          useColumnAsXLabel?: boolean;
        };

        // Execute query
        const result = executeQuery(databasePath, query);

        if (result.rows.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "Query returned 0 rows. No visualization created.",
              },
            ],
          };
        }

        // Create visualization based on type
        let viz;

        if (visualizationType === "table") {
          // For tables, just transform all columns
          const tableData = transformToTable(result.rows, result.columns);

          viz = stateManager.addVisualization({
            type: "table",
            table: tableData,
            title,
            description,
          });
        } else {
          // For charts, need column mapping
          if (
            !columnMapping ||
            !columnMapping.xColumn ||
            !columnMapping.yColumns
          ) {
            throw new Error(
              "columnMapping with xColumn and yColumns is required for chart visualizations",
            );
          }

          const series = transformToSeries(
            result.rows,
            result.columns,
            columnMapping,
          );

          const xLabels = useColumnAsXLabel
            ? extractXLabels(result.rows, columnMapping.xColumn)
            : undefined;

          viz = stateManager.addVisualization({
            type: visualizationType,
            series,
            title,
            description,
            xLabels,
          });
        }

        const port = getServerPort() || 3000;
        return {
          content: [
            {
              type: "text",
              text: `Created ${visualizationType} visualization with ${result.rows.length} rows. ID: ${viz.id}. View at http://localhost:${port}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing query and creating visualization: ${error instanceof Error ? error.message : String(error)}`,
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
  await startApiServer();

  // Start MCP server on stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.log("Chart Canvas MCP Server running");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
