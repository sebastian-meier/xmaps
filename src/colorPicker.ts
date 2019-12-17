import * as d3 from "d3";

const colorPicker = (selectionId: string) => {
  const baseColors = [
    [[255, 255, 255], [127.5, 127.5, 127.5], [0, 0, 0]],
    [[255, 255, 255], [255,   0,     0],     [0, 0, 0]],
    [[255, 255, 255], [255,   127.5, 0],     [0, 0, 0]],
    [[255, 255, 255], [255,   255,   0],     [0, 0, 0]],
    [[255, 255, 255], [127.5,   255, 0],     [0, 0, 0]],
    [[255, 255, 255], [0,     255,   0],     [0, 0, 0]],
    [[255, 255, 255], [0,     255,   127.5], [0, 0, 0]],
    [[255, 255, 255], [0,     255,   255],   [0, 0, 0]],
    [[255, 255, 255], [0,     127.5, 255],   [0, 0, 0]],
    [[255, 255, 255], [0,     0,     255],   [0, 0, 0]],
    [[255, 255, 255], [127.5, 0,     255],   [0, 0, 0]],
    [[255, 255, 255], [255,   0,     255],   [0, 0, 0]],
    [[255, 255, 255], [255,   0,     127.5], [0, 0, 0]],
    [[255, 255, 255], [255,   0,     0],     [0, 0, 0]],
  ];

  const colors = baseColors.map((range) => {
    const colorRange = range.map((color: [number, number, number]) => d3.rgb(...color));
    return [
      colorRange[0],
      d3.interpolateRgb(colorRange[0], colorRange[1])(0.25),
      d3.interpolateRgb(colorRange[0], colorRange[1])(0.5),
      d3.interpolateRgb(colorRange[0], colorRange[1])(0.75),
      colorRange[1],
      d3.interpolateRgb(colorRange[1], colorRange[2])(0.25),
      d3.interpolateRgb(colorRange[1], colorRange[2])(0.5),
      d3.interpolateRgb(colorRange[1], colorRange[2])(0.75),
      colorRange[2],
    ];
  });

  const colorCells = [];

  for (let c = 0; c < colors[0].length; c += 1) {
    if (colorCells.length < c + 1) {
      colorCells.push([]);
    }
    for (let cc = 0; cc < colors.length; cc += 1) {
      colorCells[c].push(colors[cc][c]);
    }
  }

  const selection: any = d3.select("#picker-" + selectionId);
  selection.selectAll("tr").data(colorCells).enter().append("tr")
    .selectAll("td").data((d) => d).enter().append("td")
      .style("background-color", (d) => d)
      .on("click", (d) => {
        d3.select("#" + selectionId).property("value", d);
        d3.select("#display-" + selectionId)
          .style("background-color", d);
      });

  d3.select("#" + selectionId).on("keyup", (d, i, nodes) => {
    const current = d3.select(nodes[i]).property("value");
    d3.select("#display-" + selectionId)
      .style("background-color", current);
  });

};

export { colorPicker };
