"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var turf = require("@turf/turf");
var d3 = require("d3");
var L = require("leaflet");
var leafletSearch = require("leaflet-search");
var colorPicker_1 = require("./colorPicker");
colorPicker_1.colorPicker("color1");
colorPicker_1.colorPicker("color2");
var height = 500;
var width = 500;
var radius = 200;
var overpassRadius = 500;
var longitude = 13.308507; // 13.328410; // 13.372153;
var latitude = 52.466716; // 52.471568; // 52.417117;
var selectionMap = L.map("map").setView([latitude, longitude], 15);
// L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//     attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
// }).addTo(map);
L.tileLayer("https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png", {
    attribution: "Map tiles by <a href=\"http://stamen.com\" class=\" cf--modified\">Stamen Design</a>, under <a href=\"http://creativecommons.org/licenses/by/3.0\" class=\" cf--modified\">CC BY 3.0</a>. Data by <a href=\"http://openstreetmap.org\" class=\" cf--modified\">OpenStreetMap</a>, under <a href=\"http://www.openstreetmap.org/copyright\" class=\" cf--modified\">ODbL</a>.",
}).setOpacity(0.4).addTo(selectionMap);
selectionMap.addControl(new leafletSearch({
    autoCollapse: true,
    autoType: false,
    jsonpParam: "json_callback",
    marker: false,
    minLength: 2,
    propertyLoc: ["lat", "lon"],
    propertyName: "display_name",
    url: "https://nominatim.openstreetmap.org/search?format=json&q={s}",
}));
var centerControl = L.control({
    centerControl: "topright",
});
centerControl.onAdd = function (map) {
    this._div = L.DomUtil.create("div", "centerMarker");
    this._div.innerHTML = "<img src=\"images/centerMarker.svg\" width=\"50\" height=\"50\" />";
    return this._div;
};
centerControl.addTo(selectionMap);
var render = function (cLatitude, cLongitude) {
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
        var svg = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height);
        var defs = svg.append("defs")
            .html("<radialGradient gradientUnits=\"userSpaceOnUse\" id=\"gradient\" cx=\"" + width / 2 + "\" cy=\"" + height / 2 + "\" r=\"" + radius + "\">      <stop stop-color=\"black\" offset=\"0%\"/>      <stop stop-color=\"red\" offset=\"100%\"/>  </radialGradient>");
        var projection = d3.geoMercator()
            .scale(1000000)
            .center([start.geometry.coordinates[0], start.geometry.coordinates[1]])
            .translate([width / 2, height / 2]);
        var maxDist = 0.5;
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
        var strokeScale = d3.scaleLinear().range([5, 1]).domain([0, maxDist]);
        svg.append("g").selectAll("line")
            .data(lineData).enter().append("line")
            .style("stroke", "url(#gradient)") // TODO: UUID
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
    };
    request.send(encodeURI("data=" + query));
};
d3.select("#btn-render").on("click", function () {
    var latLng = selectionMap.getCenter();
    render(latLng.lat, latLng.lng);
});
//# sourceMappingURL=main.js.map