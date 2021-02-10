const allSensorsData = require("./src/assets/sensors-data");
const d3 = require("d3");
const MapConfig = require("./src/config");
const mapData = require("./src/assets/map-data");
const fs = require("fs");

const scaleX = d3
    .scaleLinear()
    .domain([MapConfig.LONGITUDE.MIN, MapConfig.LONGITUDE.MAX])
    .range([
      mapData.svg.viewBox.x,
      mapData.svg.viewBox.x + mapData.svg.viewBox.width,
    ]),
  scaleY = d3
    .scaleLinear()
    .domain([MapConfig.LATITUDE.MIN, MapConfig.LATITUDE.MAX])
    .range([
      mapData.svg.viewBox.y + mapData.svg.viewBox.height,
      mapData.svg.viewBox.y,
    ]);

const data = allSensorsData.map((item) => {
  const x = scaleX(item.long),
    y = scaleY(item.lat),
    length = mapData.layers[3].paths.length;

  let i = 0;
  const base = mapData.layers[3];
  for (; i < length; i++) {
    const state = base.paths[i];

    if (d3.polygonContains(state.coordinates, [x, y])) {
      break;
    }
  }

  if (i < length) {
    item.region = base.paths[i].index;
  } else {
    item.region = -1;
  }

  return item;
});

fs.writeFileSync("map-data-2.json", JSON.stringify(data));

console.log("finish");
