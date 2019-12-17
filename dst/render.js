"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var turf = require("@turf/turf");
var d3 = require("d3");
var uuid = require("uuid/v4");
var height = 500;
var width = 500;
var margin = 20;
var radius = 200;
var overpassRadius = 500;
var maxDist = 0.5;
var render = function (cLatitude, cLongitude, innerColor, outerColor, modifyStroke, bigLabel, smallLabel) {
    var visID = uuid();
    smallLabel = smallLabel.trim();
    bigLabel = bigLabel.trim();
    var query = "[out:json][timeout:25];  (    relation[\"highway\"](around:" + overpassRadius + "," + cLatitude + "," + cLongitude + ");    way[\"highway\"](around:" + overpassRadius + "," + cLatitude + "," + cLongitude + ");    node[\"highway\"](around:" + overpassRadius + "," + cLatitude + "," + cLongitude + ");  );  out body;  >;  out skel qt;";
    var request = new XMLHttpRequest();
    request.responseType = "json";
    request.open("POST", "https://overpass-api.de/api/interpreter");
    request.onload = function () {
        var nodeMap = {};
        var nodes = [];
        var edges = [];
        var completed = [];
        var lineData = [];
        request.response.elements.forEach(function (element) {
            if (element.type === "node") {
                element.edges = [];
                nodeMap[element.id] = nodes.length;
                nodes.push(element);
            }
            else if (element.type === "way") {
                for (var i = 0; i < element.nodes.length - 1; i += 1) {
                    edges.push({
                        from: element.nodes[i],
                        to: element.nodes[i + 1],
                    });
                }
            }
        });
        edges.forEach(function (edge) {
            if (nodes[nodeMap[edge.from]].edges.indexOf(edge.to) === -1) {
                nodes[nodeMap[edge.from]].edges.push(edge.to);
            }
            if (nodes[nodeMap[edge.to]].edges.indexOf(edge.from) === -1) {
                nodes[nodeMap[edge.to]].edges.push(edge.from);
            }
        });
        var start = turf.nearest(turf.point([cLongitude, cLatitude]), turf.featureCollection(nodes.map(function (node) { return turf.point([node.lon, node.lat]); })));
        var startID = null;
        nodes.forEach(function (node, ni) {
            if (node.lon === start.geometry.coordinates[0] &&
                node.lat === start.geometry.coordinates[1]) {
                startID = ni;
            }
        });
        var svgContainer = d3.select("#vis").insert("div", ":first-child");
        var svg = svgContainer.append("svg")
            .attr("id", "uuid_" + visID)
            .attr("width", width)
            .attr("height", height);
        var defs = svg.append("defs")
            .html("<radialGradient gradientUnits=\"userSpaceOnUse\" id=\"gradient_" + visID + "\" cx=\"" + width / 2 + "\" cy=\"" + height / 2 + "\" r=\"" + radius + "\">      <stop style=\"stop-color:" + innerColor + ";\" offset=\"0%\"/>      <stop style=\"stop-color:" + outerColor + ";\" offset=\"100%\"/>    </radialGradient>");
        var group = svg.append("g");
        var zoomScale = 1500000;
        if (bigLabel.length > 0 && smallLabel.length > 0) {
            zoomScale = 1200000;
        }
        else if (bigLabel.length > 0) {
            zoomScale = 1250000;
        }
        else if (smallLabel.length > 0) {
            zoomScale = 1300000;
        }
        var projection = d3.geoMercator()
            .scale(zoomScale)
            .center([start.geometry.coordinates[0], start.geometry.coordinates[1]])
            .translate([width / 2, height / 2]);
        var traverse = function (rootIDs, level) {
            var traverseNodes = [];
            rootIDs.forEach(function (rootID) {
                nodes[nodeMap[rootID]].edges.forEach(function (edge) {
                    var coord0 = [nodes[nodeMap[rootID]].lon, nodes[nodeMap[rootID]].lat];
                    var coord1 = [nodes[startID].lon, nodes[startID].lat];
                    var coord2 = [nodes[nodeMap[edge]].lon, nodes[nodeMap[edge]].lat];
                    var key = edge + "_" + rootID;
                    var dist = turf.distance(turf.point(coord1), turf.point(coord2));
                    if (completed.indexOf(key) === -1 &&
                        dist < maxDist) {
                        completed.push(key);
                        var p1 = projection(coord0);
                        var p2 = projection(coord2);
                        lineData.push({
                            dist: dist,
                            level: level,
                            x1: p1[0],
                            x2: p2[0],
                            y1: p1[1],
                            y2: p2[1],
                        });
                        traverseNodes.push(edge);
                    }
                });
            });
            if (traverseNodes.length > 0) {
                traverse(traverseNodes, level + 1);
            }
        };
        completed.push(nodes[startID].id);
        traverse([nodes[startID].id], 0);
        var maxStroke = 5;
        if (!modifyStroke) {
            maxStroke = 1;
        }
        var strokeScale = d3.scaleLinear().range([maxStroke, 1]).domain([0, maxDist]);
        group.append("g").selectAll("line")
            .data(lineData).enter().append("line")
            .style("stroke", "url(#gradient_" + visID + ")")
            .style("stroke-width", function (d) { return strokeScale(d.dist); })
            .style("stroke-linecap", "round")
            .style("opacity", 0)
            .attr("x1", function (d) { return d.x1; })
            .attr("y1", function (d) { return d.y1; })
            .attr("x2", function (d) { return d.x2; })
            .attr("y2", function (d) { return d.y2; })
            .transition()
            .delay(function (d) { return d.level * 50; })
            .duration(50)
            .style("opacity", 1);
        var groupOffset = 0;
        if (smallLabel.length > 0) {
            var offsetY = 30;
            var smallLabelText = svg.append("text")
                .text(smallLabel)
                .style("font-size", "18px")
                .style("text-anchor", "middle")
                .attr("transform", "translate(" + width / 2 + ", " + (height - offsetY) + ")");
            var bbox = smallLabelText.node().getBoundingClientRect();
            var scale = (width - margin * 2) / bbox.width;
            if (scale < 1) {
                smallLabelText.attr("transform", "translate(" + width / 2 + ", " + (height - offsetY) + ") scale(" + scale + ")");
            }
            else {
                scale = 1;
            }
            groupOffset = bbox.height * scale + offsetY;
        }
        if (bigLabel.length > 0) {
            var offsetY = 45;
            if (groupOffset > 0) {
                offsetY = 75;
            }
            var bigLabelText = svg.append("text")
                .text(bigLabel)
                .style("font-weight", "bold")
                .style("font-size", "36px")
                .attr("text-anchor", "middle")
                .attr("transform", "translate(" + width / 2 + ", " + (height - offsetY) + ")");
            var bbox = bigLabelText.node().getBoundingClientRect();
            var scale = (width - margin * 2) / bbox.width;
            if (scale < 1) {
                bigLabelText.attr("transform", "translate(" + width / 2 + ", " + (height - offsetY) + ") scale(" + scale + ")");
            }
            else {
                scale = 1;
            }
            groupOffset = bbox.height * scale + offsetY;
        }
        group.attr("transform", "translate(0,-" + groupOffset / 2 + ")");
    };
    request.send(encodeURI("data=" + query));
};
exports.render = render;
//# sourceMappingURL=render.js.map