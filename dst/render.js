"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var turf = require("@turf/turf");
var canvg_1 = require("canvg");
var d3 = require("d3");
var GIF = require("gif.js.optimized");
var uuid = require("uuid/v4");
var height = 500;
var width = 500;
var margin = 20;
var radius = 200;
var overpassRadius = 500;
var maxDist = 0.5;
var render = function (cLatitude, cLongitude, innerColor, outerColor, modifyStroke, bigLabel, smallLabel, mirror, svgOnly, bgColor, textColor) {
    return new Promise(function (resolve, reject) {
        var visID = uuid();
        smallLabel = smallLabel.trim();
        bigLabel = bigLabel.trim();
        var query = "[out:json][timeout:25];    (      relation[\"highway\"](around:" + overpassRadius + "," + cLatitude + "," + cLongitude + ");      way[\"highway\"](around:" + overpassRadius + "," + cLatitude + "," + cLongitude + ");      node[\"highway\"](around:" + overpassRadius + "," + cLatitude + "," + cLongitude + ");    );    out body;    >;    out skel qt;";
        var request = new XMLHttpRequest();
        request.responseType = "json";
        request.open("POST", "https://overpass-api.de/api/interpreter"); // https://overpass.nchc.org.tw/api/interpreter
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
            var svgContainer = d3.select("#vis").insert("div", ":first-child")
                .attr("id", "container_" + visID)
                .append("div");
            var svg = svgContainer.append("svg")
                .attr("id", "uuid_" + visID)
                .attr("viewBox", "0 0 " + width + " " + height)
                .attr("preserveAspectRatio", "xMidYMid meet")
                .attr("width", width)
                .attr("height", height);
            svg.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", width)
                .attr("height", height)
                .style("fill", bgColor);
            var defs = svg.append("defs")
                .html("<radialGradient gradientUnits=\"userSpaceOnUse\" id=\"gradient_" + visID + "\" cx=\"" + width / 2 + "\" cy=\"" + height / 2 + "\" r=\"" + radius + "\">        <stop style=\"stop-color:" + innerColor + ";\" offset=\"0%\"/>        <stop style=\"stop-color:" + outerColor + ";\" offset=\"100%\"/>      </radialGradient>");
            defs.append("mask")
                .attr("id", "mask_" + visID)
                .html(function () {
                var mX = width / 2;
                var mY = height / 2;
                switch (mirror) {
                    case "2":
                        mX = 0;
                        mY = 0;
                        break;
                    case "3":
                        mY = 0;
                        break;
                    case "4":
                        mX = 0;
                        break;
                }
                return "<rect fill=\"white\" x=\"" + mX + "\" y=\"" + mY + "\" width=\"" + width / 2 + "\" height=\"" + height / 2 + "\" />";
            });
            var pattern = defs.append("pattern")
                .attr("id", "pattern_" + visID)
                .attr("viewBox", "0 0 " + width + " " + height)
                .attr("width", "100%")
                .attr("height", "100%");
            for (var pi = 1; pi <= 4; pi += 1) {
                var patternTransform = "";
                switch (pi) {
                    case 2:
                        patternTransform = "scale(1,-1) translate(0," + height + ")";
                        break;
                    case 3:
                        patternTransform = "scale(-1,-1) translate(" + width + "," + height + ")";
                        break;
                    case 4:
                        patternTransform = "scale(-1,1) translate(" + width + ",0)";
                        break;
                }
                var p = defs.append("pattern")
                    .attr("id", "pattern_" + pi + "_" + visID)
                    .attr("viewBox", "0 0 " + width + " " + height)
                    .attr("width", "100%")
                    .attr("height", "100%")
                    .attr("patternTransform", patternTransform)
                    .html("<rect fill=\"url(#pattern_" + visID + ")\" x=\"0\" y=\"0\" width=\"" + width + "\" height=\"" + height + "\"></rect>");
                if (mirror !== "6") {
                    p.select("rect").attr("mask", "url(#mask_" + visID + ")");
                }
            }
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
            var maxLevels = 0;
            var traverse = function (rootIDs, level) {
                if (maxLevels < level) {
                    maxLevels = level;
                }
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
            var lineContainer = pattern;
            if (mirror === "1") {
                lineContainer = group;
            }
            lineContainer.append("g").selectAll("line")
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
            if (mirror !== "1") {
                for (var ri = 1; ri <= 4; ri += 1) {
                    group.append("rect")
                        .attr("x", 0)
                        .attr("y", 0)
                        .attr("width", width)
                        .attr("height", height)
                        .attr("fill", "url(#pattern_" + ri + "_" + visID + ")");
                }
            }
            var groupOffset = 0;
            if (smallLabel.length > 0) {
                var offsetY = 30;
                var smallLabelText = svg.append("text")
                    .text(smallLabel)
                    .style("font-size", "18px")
                    .style("text-anchor", "middle")
                    .style("fill", textColor)
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
                    .style("fill", textColor)
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
            /* ---.--- OFFSCREEN RENDERING ---.--- */
            var offscreenSVG = d3.select("#gif-svg");
            offscreenSVG.selectAll("*").remove();
            offscreenSVG.html(svgContainer.html().split(visID).join("alt_" + visID));
            offscreenSVG.selectAll("line").data(lineData)
                .style("opacity", 0);
            var bg = offscreenSVG.select("svg").insert("rect", ":first-child");
            bg
                .style("fill", "#ffffff")
                .attr("height", height)
                .attr("width", width);
            var offscreenCanvasContainer = d3.select("#gif-canvas");
            offscreenCanvasContainer.selectAll("*").remove();
            var offscreenCanvas = offscreenCanvasContainer.append("canvas")
                .attr("width", width)
                .attr("height", height);
            var offscreenContext = offscreenCanvas.node().getContext("2d");
            var addButtons = function () { return __awaiter(void 0, void 0, void 0, function () {
                var svgContent;
                return __generator(this, function (_a) {
                    // render one big PNG for downloading
                    offscreenSVG.select("svg")
                        .style("width", width)
                        .style("height", height);
                    offscreenSVG.selectAll("line")
                        .style("opacity", 1);
                    offscreenSVG.select("rect").remove();
                    svgContent = offscreenSVG.node().innerHTML;
                    svgContent = svgContent.replace("<svg", "<?xml version=\"1.0\" standalone=\"no\"?><svg xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns=\"http://www.w3.org/2000/svg\"");
                    svgContainer.append("a")
                        .attr("class", "btn download-btn")
                        .text("SVG")
                        .attr("href", URL.createObjectURL(new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" })))
                        .attr("download", "map.svg");
                    svgContainer.append("a")
                        .attr("class", "btn repeat-btn")
                        .text("Replay Animation")
                        .on("click", function () {
                        lineContainer.selectAll("line")
                            .style("opacity", 0)
                            .transition()
                            .delay(function (d) { return d.level * 50; })
                            .duration(50)
                            .style("opacity", 1);
                    });
                    resolve(visID);
                    return [2 /*return*/];
                });
            }); };
            if (!svgOnly && mirror === "1") {
                var gif_1 = new GIF({
                    height: height,
                    quality: 2,
                    width: width,
                    workerScript: "./js/gif.worker.js",
                    workers: 2,
                });
                gif_1.on("finished", function (blob) { return __awaiter(void 0, void 0, void 0, function () {
                    var canvgEndProcess;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                svgContainer.append("a")
                                    .attr("class", "btn download-btn")
                                    .text("GIF")
                                    .attr("href", URL.createObjectURL(blob))
                                    .attr("download", "map.gif");
                                offscreenSVG.select("svg")
                                    .style("width", width * 5)
                                    .style("height", height * 5);
                                offscreenSVG.selectAll("line")
                                    .style("opacity", 1);
                                offscreenSVG.select("rect").remove();
                                offscreenCanvas
                                    .attr("width", width * 5)
                                    .attr("height", height * 5);
                                return [4 /*yield*/, canvg_1.default.fromString(offscreenContext, offscreenSVG.html())];
                            case 1:
                                canvgEndProcess = _a.sent();
                                return [4 /*yield*/, canvgEndProcess.render()];
                            case 2:
                                _a.sent();
                                svgContainer.append("a")
                                    .attr("class", "btn download-btn")
                                    .text("PNG")
                                    .attr("href", offscreenCanvas.node().toDataURL())
                                    .attr("download", "map.png");
                                addButtons();
                                // Making sure the gif system is not taking up any ressources
                                gif_1.freeWorkers.forEach(function (worker) {
                                    worker.terminate();
                                });
                                gif_1.activeWorkers.forEach(function (worker) {
                                    worker.terminate();
                                });
                                gif_1 = null;
                                return [2 /*return*/];
                        }
                    });
                }); });
                var renderFrame_1 = function (frameId) { return __awaiter(void 0, void 0, void 0, function () {
                    var canvgProcess;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                offscreenSVG.selectAll("line")
                                    .style("opacity", function (d) {
                                    if (d.level < frameId) {
                                        return 1;
                                    }
                                    return 0;
                                });
                                return [4 /*yield*/, canvg_1.default.fromString(offscreenContext, offscreenSVG.html())];
                            case 1:
                                canvgProcess = _a.sent();
                                return [4 /*yield*/, canvgProcess.render()];
                            case 2:
                                _a.sent();
                                gif_1.addFrame(offscreenContext, { copy: true, delay: 10 });
                                if (frameId < maxLevels) {
                                    renderFrame_1(frameId + 1);
                                }
                                else {
                                    gif_1.render();
                                }
                                return [2 /*return*/];
                        }
                    });
                }); };
                renderFrame_1(0);
            }
            else {
                addButtons();
            }
        };
        request.send(encodeURI("data=" + query));
    });
};
exports.render = render;
//# sourceMappingURL=render.js.map