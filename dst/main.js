"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var turf = require("@turf/turf");
var d3 = require("d3");
var width = 500;
var height = 500;
var radius = 500;
var longitude = 13.308507; // 13.328410; // 13.372153;
var latitude = 52.466716; // 52.471568; // 52.417117;
var query = "[out:json][timeout:25];(  relation[\"highway\"](around:" + radius + "," + latitude + "," + longitude + ");  way[\"highway\"](around:" + radius + "," + latitude + "," + longitude + ");  node[\"highway\"](around:" + radius + "," + latitude + "," + longitude + "););out body;>;out skel qt;";
var request = new XMLHttpRequest();
request.responseType = "json";
request.open("POST", "https://overpass-api.de/api/interpreter");
request.onload = function () {
    var nodeMap = {};
    var nodes = [];
    var edges = [];
    var completed = [];
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
        if (nodes[nodeMap[edge.from]].edges.indexOf(edge.to) === -1 &&
            edge.from in nodeMap &&
            edge.to in nodeMap) {
            nodes[nodeMap[edge.from]].edges.push(edge.to);
        }
        if (nodes[nodeMap[edge.to]].edges.indexOf(edge.from) === -1 &&
            edge.from in nodeMap &&
            edge.to in nodeMap) {
            nodes[nodeMap[edge.to]].edges.push(edge.from);
        }
    });
    var start = turf.nearest(turf.point([longitude, latitude]), turf.featureCollection(nodes.map(function (node) { return turf.point([node.lon, node.lat]); })));
    var startID = null;
    nodes.forEach(function (node, ni) {
        if (node.lon === start.geometry.coordinates[0] &&
            node.lat === start.geometry.coordinates[1]) {
            startID = ni;
        }
    });
    var svg = d3.select("body")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    var projection = d3.geoMercator()
        .scale(1000000)
        .center([longitude, latitude])
        .translate([width / 2, height / 2]);
    // const circles = svg.append("g")
    //   .selectAll("circle")
    //   .data(nodes)
    //   .enter().append("circle")
    //     .attr("r", 1)
    //     .attr("cx", (d: {lon: number, lat: number}) => projection([d.lon, d.lat])[0])
    //     .attr("cy", (d: {lon: number, lat: number}) => projection([d.lon, d.lat])[1]);
    var network = svg.append("g");
    var maxDist = 0.5;
    var traverse = function (rootID, level) {
        nodes[rootID].edges.forEach(function (edge) {
            if (completed.indexOf(edge) === -1 &&
                turf.distance(turf.point([nodes[startID].lon, nodes[startID].lat]), turf.point([nodes[nodeMap[edge]].lon, nodes[nodeMap[edge]].lat])) < maxDist) {
                completed.push(edge);
                network.append("line")
                    .style("stroke", "black")
                    .style("opacity", 0)
                    .attr("x1", projection([nodes[rootID].lon, nodes[rootID].lat])[0])
                    .attr("y1", projection([nodes[rootID].lon, nodes[rootID].lat])[1])
                    .attr("x2", projection([nodes[nodeMap[edge]].lon, nodes[nodeMap[edge]].lat])[0])
                    .attr("y2", projection([nodes[nodeMap[edge]].lon, nodes[nodeMap[edge]].lat])[1])
                    .transition()
                    .delay(level * 50)
                    .duration(50)
                    .style("opacity", 1);
                traverse(nodeMap[edge], level + 1);
            }
        });
    };
    completed.push(startID);
    traverse(startID, 0);
    svg.append("g")
        .append("circle")
        .attr("cx", width / 2)
        .attr("cy", 10)
        .attr("r", 5)
        .style("fill", "black");
    svg.append("g")
        .append("line")
        .style("stroke", "black")
        .style("stroke-width", 3)
        .attr("x1", width / 2)
        .attr("y1", 10)
        .attr("x2", projection([start.geometry.coordinates[0], start.geometry.coordinates[1]])[0])
        .attr("y2", projection([start.geometry.coordinates[0], start.geometry.coordinates[1]])[1]);
    var root = svg.append("g")
        .append("circle")
        .attr("cx", projection([start.geometry.coordinates[0], start.geometry.coordinates[1]])[0])
        .attr("cy", projection([start.geometry.coordinates[0], start.geometry.coordinates[1]])[1])
        .attr("r", 5)
        .style("fill", "black");
};
request.send(encodeURI("data=" + query));
//# sourceMappingURL=main.js.map