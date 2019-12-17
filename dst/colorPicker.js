"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var d3 = require("d3");
var colorPicker = function (selectionId) {
    var baseColors = [
        [[255, 255, 255], [127.5, 127.5, 127.5], [0, 0, 0]],
        [[255, 255, 255], [255, 0, 0], [0, 0, 0]],
        [[255, 255, 255], [255, 127.5, 0], [0, 0, 0]],
        [[255, 255, 255], [255, 255, 0], [0, 0, 0]],
        [[255, 255, 255], [127.5, 255, 0], [0, 0, 0]],
        [[255, 255, 255], [0, 255, 0], [0, 0, 0]],
        [[255, 255, 255], [0, 255, 127.5], [0, 0, 0]],
        [[255, 255, 255], [0, 255, 255], [0, 0, 0]],
        [[255, 255, 255], [0, 127.5, 255], [0, 0, 0]],
        [[255, 255, 255], [0, 0, 255], [0, 0, 0]],
        [[255, 255, 255], [127.5, 0, 255], [0, 0, 0]],
        [[255, 255, 255], [255, 0, 255], [0, 0, 0]],
        [[255, 255, 255], [255, 0, 127.5], [0, 0, 0]],
        [[255, 255, 255], [255, 0, 0], [0, 0, 0]],
    ];
    var colors = baseColors.map(function (range) {
        var colorRange = range.map(function (color) { return d3.rgb.apply(d3, color); });
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
    var colorCells = [];
    for (var c = 0; c < colors[0].length; c += 1) {
        if (colorCells.length < c + 1) {
            colorCells.push([]);
        }
        for (var cc = 0; cc < colors.length; cc += 1) {
            colorCells[c].push(colors[cc][c]);
        }
    }
    var selection = d3.select("#picker-" + selectionId);
    selection.selectAll("tr").data(colorCells).enter().append("tr")
        .selectAll("td").data(function (d) { return d; }).enter().append("td")
        .style("background-color", function (d) { return d; })
        .on("click", function (d) {
        d3.select("#" + selectionId).property("value", d);
        d3.select("#display-" + selectionId)
            .style("background-color", d);
    });
    d3.select("#" + selectionId).on("keyup", function (d, i, nodes) {
        var current = d3.select(nodes[i]).property("value");
        d3.select("#display-" + selectionId)
            .style("background-color", current);
    });
};
exports.colorPicker = colorPicker;
//# sourceMappingURL=colorPicker.js.map