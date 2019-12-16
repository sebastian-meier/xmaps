import * as turf from "@turf/turf";
import * as d3 from "d3";

const width = 500;
const height = 500;

const radius = 500;
const longitude = 13.308507; // 13.328410; // 13.372153;
const latitude = 52.466716; // 52.471568; // 52.417117;

const query = `[out:json][timeout:25];\
(\
  relation["highway"](around:${radius},${latitude},${longitude});\
  way["highway"](around:${radius},${latitude},${longitude});\
  node["highway"](around:${radius},${latitude},${longitude});\
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
    if (nodes[nodeMap[edge.from]].edges.indexOf(edge.to) === -1 &&
      edge.from in nodeMap &&
      edge.to in nodeMap
    ) {
      nodes[nodeMap[edge.from]].edges.push(edge.to);
    }
    if (nodes[nodeMap[edge.to]].edges.indexOf(edge.from) === -1 &&
    edge.from in nodeMap &&
    edge.to in nodeMap
  ) {
      nodes[nodeMap[edge.to]].edges.push(edge.from);
    }
  });

  const start = turf.nearest(
    turf.point([longitude, latitude]),
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

  const svg = d3.select("body")
    .append("svg")
      .attr("width", width)
      .attr("height", height);

  const projection = d3.geoMercator()
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

  const network = svg.append("g");
  const maxDist = 0.5;

  const traverse = (rootID: number, level: number) => {
    nodes[rootID].edges.forEach((edge) => {
      if (
        completed.indexOf(edge) === -1 &&
        turf.distance(
          turf.point([nodes[startID].lon, nodes[startID].lat]),
          turf.point([nodes[nodeMap[edge]].lon, nodes[nodeMap[edge]].lat]),
        ) < maxDist
      ) {
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
      .attr("y2", projection([start.geometry.coordinates[0], start.geometry.coordinates[1]])[1])

  const root = svg.append("g")
    .append("circle")
      .attr("cx", projection([start.geometry.coordinates[0], start.geometry.coordinates[1]])[0])
      .attr("cy", projection([start.geometry.coordinates[0], start.geometry.coordinates[1]])[1])
      .attr("r", 5)
      .style("fill", "black");

};
request.send(encodeURI("data=" + query));
