import * as turf from "@turf/turf";
import Canvg from "canvg";
import * as d3 from "d3";
import * as GIF from "gif.js.optimized";
import * as uuid from "uuid/v4";

const height = 500;
const width =  500;
const margin = 20;
const radius = 200;
const overpassRadius = 500;
const maxDist = 0.5;

const render = (
  cLatitude: number,
  cLongitude: number,
  innerColor: string,
  outerColor: string,
  modifyStroke: boolean,
  bigLabel: string,
  smallLabel: string,
  mirror: string,
  svgOnly: boolean,
  bgColor: string,
  textColor: string,
): Promise<any> => {

  return new Promise((resolve, reject) => {

    const visID = uuid();

    smallLabel = smallLabel.trim();
    bigLabel = bigLabel.trim();

    const query = `[out:json][timeout:25];\
    (\
      relation["highway"](around:${overpassRadius},${cLatitude},${cLongitude});\
      way["highway"](around:${overpassRadius},${cLatitude},${cLongitude});\
      node["highway"](around:${overpassRadius},${cLatitude},${cLongitude});\
    );\
    out body;\
    >;\
    out skel qt;`;

    const request = new XMLHttpRequest();
    request.responseType = "json";
    request.open("POST", "https://overpass-api.de/api/interpreter"); // https://overpass.nchc.org.tw/api/interpreter
    request.onload = () => {

      const nodeMap = {};
      const nodes = [];
      const edges = [];
      const completed = [];
      const lineData = [];

      request.response.elements.forEach((element) => {
        if (element.type === "node") {
          element.edges = [];
          nodeMap[element.id] = nodes.length;
          nodes.push(element);
        } else if (element.type === "way") {
          for (let i = 0; i < element.nodes.length - 1; i += 1) {
            edges.push({
              from: element.nodes[i],
              to: element.nodes[i + 1],
            });
          }
        }
      });

      edges.forEach((edge) => {
        if (nodes[nodeMap[edge.from]].edges.indexOf(edge.to) === -1) {
          nodes[nodeMap[edge.from]].edges.push(edge.to);
        }
        if (nodes[nodeMap[edge.to]].edges.indexOf(edge.from) === -1) {
          nodes[nodeMap[edge.to]].edges.push(edge.from);
        }
      });

      const start = turf.nearest(
        turf.point([cLongitude, cLatitude]),
        turf.featureCollection(
          nodes.map((node) => turf.point([node.lon, node.lat])),
        ),
      );

      let startID = null;
      nodes.forEach((node, ni) => {
        if (
          node.lon === start.geometry.coordinates[0] &&
          node.lat === start.geometry.coordinates[1]
        ) {
          startID = ni;
        }
      });

      const svgContainer = d3.select("#vis").insert("div", ":first-child")
        .attr("id", "container_" + visID)
        .append("div");

      const svg = svgContainer.append("svg")
        .attr("id", "uuid_" + visID)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("width", width)
        .attr("height", height);

      svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .style("fill", bgColor);

      const defs = svg.append("defs")
        .html(`<radialGradient gradientUnits="userSpaceOnUse" id="gradient_${visID}" cx="${width / 2}" cy="${height / 2}" r="${radius}">\
        <stop style="stop-color:${innerColor};" offset="0%"/>\
        <stop style="stop-color:${outerColor};" offset="100%"/>\
      </radialGradient>`);

      defs.append("mask")
        .attr("id", "mask_" + visID)
        .html(() => {
          let mX = width / 2;
          let mY = height / 2;
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
          return `<rect fill="white" x="${mX}" y="${mY}" width="${width / 2}" height="${height / 2}" />`;
        });

      const pattern = defs.append("pattern")
        .attr("id", "pattern_" + visID)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");

      for (let pi = 1; pi <= 4; pi += 1) {
        let patternTransform = "";
        switch (pi) {
          case 2:
            patternTransform = `scale(1,-1) translate(0,${height})`;
            break;
          case 3:
            patternTransform = `scale(-1,-1) translate(${width},${height})`;
            break;
          case 4:
            patternTransform = `scale(-1,1) translate(${width},0)`;
            break;
        }
        const p = defs.append("pattern")
          .attr("id", "pattern_" + pi + "_" + visID)
          .attr("viewBox", `0 0 ${width} ${height}`)
          .attr("width", "100%")
          .attr("height", "100%")
          .attr("patternTransform", patternTransform)
          .html(`<rect fill="url(#pattern_${visID})" x="0" y="0" width="${width}" height="${height}"></rect>`);

        if (mirror !== "6") {
          p.select("rect").attr("mask", `url(#mask_${visID})`);
        }
      }

      const group = svg.append("g");

      let zoomScale = 1500000;
      if (bigLabel.length > 0 && smallLabel.length > 0) {
        zoomScale = 1200000;
      } else if (bigLabel.length > 0) {
        zoomScale = 1250000;
      } else if (smallLabel.length > 0) {
        zoomScale = 1300000;
      }

      const projection = d3.geoMercator()
        .scale(zoomScale)
        .center([start.geometry.coordinates[0], start.geometry.coordinates[1]])
        .translate([width / 2, height / 2]);

      let maxLevels = 0;

      const traverse = (rootIDs: number[], level: number) => {
        if (maxLevels < level) {
          maxLevels = level;
        }
        const traverseNodes = [];
        rootIDs.forEach((rootID) => {
          nodes[nodeMap[rootID]].edges.forEach((edge) => {
            const coord0: [number, number] = [nodes[nodeMap[rootID]].lon, nodes[nodeMap[rootID]].lat];
            const coord1: [number, number] = [nodes[startID].lon, nodes[startID].lat];
            const coord2: [number, number] = [nodes[nodeMap[edge]].lon, nodes[nodeMap[edge]].lat];
            const key = edge + "_" + rootID;
            const dist = turf.distance(turf.point(coord1), turf.point(coord2));
            if (
              completed.indexOf(key) === -1 &&
              dist < maxDist
            ) {
              completed.push(key);

              const p1 = projection(coord0);
              const p2 = projection(coord2);

              lineData.push({
                dist,
                level,
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

      let maxStroke = 5;
      if (!modifyStroke) {
        maxStroke = 1;
      }

      const strokeScale = d3.scaleLinear().range([maxStroke, 1]).domain([0, maxDist]);

      let lineContainer: any = pattern;
      if (mirror === "1") {
        lineContainer = group;
      }

      lineContainer.append("g").selectAll("line")
        .data(lineData).enter().append("line")
          .style("stroke", `url(#gradient_${visID})`)
          .style("stroke-width", (d) => strokeScale(d.dist))
          .style("stroke-linecap", "round")
          .style("opacity", 0)
          .attr("x1", (d) => d.x1)
          .attr("y1", (d) => d.y1)
          .attr("x2", (d) => d.x2)
          .attr("y2", (d) => d.y2)
          .transition()
            .delay((d) => d.level * 50)
            .duration(50)
              .style("opacity", 1);

      if (mirror !== "1") {
        for (let ri = 1; ri <= 4; ri += 1) {
          group.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height)
            .attr("fill", `url(#pattern_${ri}_${visID})`);
        }
      }

      let groupOffset = 0;

      if (smallLabel.length > 0) {
        const offsetY = 30;
        const smallLabelText = svg.append("text")
          .text(smallLabel)
          .style("font-size", "18px")
          .style("text-anchor", "middle")
          .style("fill", textColor)
          .attr("transform", `translate(${width / 2}, ${height - offsetY})`);

        const bbox = smallLabelText.node().getBoundingClientRect();
        let scale = (width - margin * 2) / bbox.width;
        if (scale < 1) {
          smallLabelText.attr("transform", `translate(${width / 2}, ${height - offsetY}) scale(${scale})`);
        } else {
          scale = 1;
        }
        groupOffset = bbox.height * scale + offsetY;
      }

      if (bigLabel.length > 0) {
        let offsetY = 45;
        if (groupOffset > 0) {
          offsetY = 75;
        }
        const bigLabelText = svg.append("text")
          .text(bigLabel)
          .style("font-weight", "bold")
          .style("font-size", "36px")
          .attr("text-anchor", "middle")
          .style("fill", textColor)
          .attr("transform", `translate(${width / 2}, ${height - offsetY})`);

        const bbox = bigLabelText.node().getBoundingClientRect();
        let scale = (width - margin * 2) / bbox.width;
        if (scale < 1) {
          bigLabelText.attr("transform", `translate(${width / 2}, ${height - offsetY}) scale(${scale})`);
        } else {
          scale = 1;
        }
        groupOffset = bbox.height * scale + offsetY;
      }

      group.attr("transform", `translate(0,-${groupOffset / 2})`);

      /* ---.--- OFFSCREEN RENDERING ---.--- */

      const offscreenSVG = d3.select("#gif-svg");
      offscreenSVG.selectAll("*").remove();
      offscreenSVG.html(svgContainer.html().split(visID).join("alt_" + visID));
      offscreenSVG.selectAll("line").data(lineData)
        .style("opacity", 0);
      const bg = offscreenSVG.select("svg").insert("rect", ":first-child");
      bg
        .style("fill", "#ffffff")
        .attr("height", height)
        .attr("width", width);

      const offscreenCanvasContainer = d3.select("#gif-canvas");
      offscreenCanvasContainer.selectAll("*").remove();
      const offscreenCanvas = offscreenCanvasContainer.append("canvas")
        .attr("width", width)
        .attr("height", height);
      const offscreenContext = offscreenCanvas.node().getContext("2d");

      const addButtons = async () => {
        // render one big PNG for downloading
        offscreenSVG.select("svg")
          .style("width", width)
          .style("height", height);

        offscreenSVG.selectAll("line")
          .style("opacity", 1);

        offscreenSVG.select("rect").remove();

        let svgContent = (offscreenSVG.node() as SVGElement).innerHTML;
        svgContent = svgContent.replace("<svg", `<?xml version="1.0" standalone="no"?><svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"`);

        svgContainer.append("a")
          .attr("class", "btn download-btn")
          .text("SVG")
          .attr("href", URL.createObjectURL(new Blob([svgContent], {type: "image/svg+xml;charset=utf-8"})))
          .attr("download", "map.svg");

        svgContainer.append("a")
          .attr("class", "btn repeat-btn")
          .html("Replay")
          .on("click", () => {
            lineContainer.selectAll("line")
              .style("opacity", 0)
              .transition()
                .delay((d: {level: number}) => d.level * 50)
                .duration(50)
                  .style("opacity", 1);
                  });

        resolve(visID);
      };

      if (!svgOnly && mirror === "1") {
        let gif = new GIF({
          height,
          quality: 2,
          width,
          workerScript: "./js/gif.worker.js",
          workers: 2,
        });

        gif.on("finished", async (blob) => {

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

          const canvgEndProcess = await Canvg.fromString(offscreenContext, offscreenSVG.html());
          await canvgEndProcess.render();

          svgContainer.append("a")
            .attr("class", "btn download-btn")
            .text("PNG")
            .attr("href", offscreenCanvas.node().toDataURL())
            .attr("download", "map.png");

          addButtons();

          // Making sure the gif system is not taking up any ressources
          gif.freeWorkers.forEach((worker) => {
            worker.terminate();
          });

          gif.activeWorkers.forEach((worker) => {
            worker.terminate();
          });

          gif = null;
        });

        const renderFrame = async (frameId: number) => {
          offscreenSVG.selectAll("line")
            .style("opacity", (d: { level: number }) => {
              if (d.level < frameId) {
                return 1;
              }
              return 0;
          });

          const canvgProcess = await Canvg.fromString(offscreenContext, offscreenSVG.html());
          await canvgProcess.render();
          gif.addFrame(offscreenContext, {copy: true, delay: 10});

          if (frameId < maxLevels) {
            renderFrame(frameId + 1);
          } else {
            gif.render();
          }
        };

        renderFrame(0);
      } else {
        addButtons();
      }
    };
    request.send(encodeURI("data=" + query));
  });
};

export { render };
