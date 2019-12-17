import * as turf from "@turf/turf";
import * as d3 from "d3";
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
) => {

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
  request.open("POST", "https://overpass-api.de/api/interpreter");
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

    const svgContainer = d3.select("#vis").insert("div", ":first-child");

    const svg = svgContainer.append("svg")
      .attr("id", "uuid_" + visID)
      .attr("width", width)
      .attr("height", height);

    const defs = svg.append("defs")
      .html(`<radialGradient gradientUnits="userSpaceOnUse" id="gradient_${visID}" cx="${width / 2}" cy="${height / 2}" r="${radius}">\
      <stop style="stop-color:${innerColor};" offset="0%"/>\
      <stop style="stop-color:${outerColor};" offset="100%"/>\
    </radialGradient>`);

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

    const traverse = (rootIDs: number[], level: number) => {
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

    group.append("g").selectAll("line")
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

    let groupOffset = 0;

    if (smallLabel.length > 0) {
      const offsetY = 30;
      const smallLabelText = svg.append("text")
        .text(smallLabel)
        .style("font-size", "18px")
        .style("text-anchor", "middle")
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
  };
  request.send(encodeURI("data=" + query));
};

export { render };
