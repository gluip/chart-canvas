import type { CanvasState } from "@/types/canvas";

export const mockCanvasState: CanvasState = {
  visualizations: [
    {
      id: "1",
      type: "line",
      series: [
        {
          name: "Data",
          data: [
            [1, 2],
            [2, 3],
            [4, 0],
            [5, 5],
          ],
        },
      ],
      title: "Sample Line Chart",
      x: 0,
      y: 0,
      w: 6,
      h: 4,
    },
    {
      id: "2",
      type: "bar",
      series: [
        {
          name: "Data",
          data: [
            [1, 5],
            [2, 8],
            [3, 3],
            [4, 7],
          ],
        },
      ],
      title: "Sample Bar Chart",
      x: 6,
      y: 0,
      w: 6,
      h: 4,
    },
    {
      id: "3",
      type: "scatter",
      series: [
        {
          name: "Data",
          data: [
            [1, 3],
            [2, 5],
            [3, 2],
            [4, 6],
            [5, 4],
          ],
        },
      ],
      title: "Sample Scatter Plot",
      x: 0,
      y: 4,
      w: 6,
      h: 4,
    },
  ],
};
