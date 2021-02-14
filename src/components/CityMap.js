import * as d3 from "d3";
import React from "react";
import MapConfig, {
  MapMobileTextLocation,
  MapStaticTextLocation,
} from "../config";
import mapData from "../assets/map-data";
import sensorsData from "../assets/sensors-data";

const staticSensors = sensorsData.reduce((accum, item) => {
  if (item.type === "static" && !accum[item["sensor-id"]]) {
    accum[item["sensor-id"]] = {
      lat: item.lat,
      long: item.long,
      id: item["sensor-id"],
    };
  }

  return accum;
}, {});

function CityMap({
  className,
  colors = {},
  selectedDate,
  data,
  showNames = true,
  showMobileSensors = true,
  showStaticSensors = true,
  onStateSelect,
  selectedState,
  dotSizeByRadiation = false,
  textData = {},
  showStateMobileValues = false,
  showStateStaticValues = false,
  showUtilities = false,
}) {
  const map = React.useRef(null);

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
  React.useEffect(() => {
    function onClick(d) {
      d3.select(map.current)
        .select("#base")
        .selectAll("path")
        .style("fill", "#fff");

      d3.select(map.current)
        .select(`#${d.target.id}`)
        .style("fill", MapConfig.COLORS.SELECTED_STATE);

      onStateSelect(d.target.getAttribute("neighborhoodId"));
    }

    function renderNames(svg) {
      const areNamesShown = !!svg.select("#names").node();

      if (areNamesShown && !showNames) {
        svg.select("#names").remove();
        return;
      } else if (!areNamesShown && showNames) {
        svg
          .append("g")
          .attr("id", mapData.layers[0].id)
          .selectAll("path")
          .data(mapData.layers[0].paths)
          .join("path")
          .attr("style", (d) => d.styles.unselected)
          .attr("d", (d) => d.d)
          .attr("neighborhoodId", (d) => d.index)
          .attr("id", (d) => d.svgId);
      }
    }

    function drawMap(mapElement) {
      const svg = mapElement
        .append("svg")
        .attr("viewBox", Object.values(mapData.svg.viewBox))
        .attr("width", "100%")
        .attr("height", "100%");
      svg
        .append("g")
        .attr("id", mapData.layers[3].id)
        .selectAll("path")
        .data(mapData.layers[3].paths)
        .join("path")
        .attr("style", (d) => d.styles.unselected)
        .attr("d", (d) => d.d)
        .attr("id", (d) => d.svgId)
        .attr("neighborhoodId", (d) => d.index)
        .on("click", onClick);
      svg
        .append("g")
        .attr("id", mapData.layers[2].id)
        .selectAll("path")
        .data(mapData.layers[2].paths)
        .join("path")
        .attr("style", (d) => d.styles.unselected)
        .attr("d", (d) => d.d)
        .attr("neighborhoodId", (d) => d.index)
        .attr("id", (d) => d.svgId);
    }

    function drawStaticSensors(svg) {
      svg.select("#static-sensors").remove();

      if (showStaticSensors) {
        svg
          .append("g")
          .attr("id", "static-sensors")
          .selectAll("rect")
          .data(Object.values(staticSensors))
          .enter()
          .append("rect")
          .attr("class", "radiation-static-glyph")
          .attr("height", 50)
          .attr("width", 50)
          .each((d, i, n) => {
            const x = scaleX(d.long),
              y = scaleY(d.lat);

            const node = d3.select(n[i]);
            node.attr("x", x);
            node.attr("y", y);
            node.attr("x-long", d.long);
            node.attr("y-lat", d.lat);
            node.attr("id", d.id);
          })
          .style("fill", MapConfig.COLORS.STATIC);
      }
    }

    function getSizeByRadiation(value) {
      if (value >= 0 && value <= 35) {
        return 20;
      } else if (value > 35 && value <= 65) {
        return 40;
      } else if (value > 65 && value <= 200) {
        return 60;
      } else if (value > 200 && value <= 1000) {
        return 80;
      } else {
        return 100;
      }
    }

    function drawMobileSensors(svg) {
      svg.select("#mobile-sensors").remove();

      if (showMobileSensors) {
        d3.select(map.current).select("svg").select(".pointText").remove();

        svg
          .append("g")
          .attr("id", "mobile-sensors")
          .selectAll("circle")
          .data(data)
          .enter()
          .append("circle")
          .attr("class", "radiation-glyph")
          .each((d, i, n) => {
            const x = scaleX(d.long),
              y = scaleY(d.lat);
            const xText = scaleX(d.long - 0.06),
              yText = scaleY(d.lat);
            const node = d3.select(n[i]);

            node.attr("cx", x);
            node.attr("cy", y);
            node.attr("long", d.long);
            node.attr("lat", d.lat);
            node.attr(
              "r",
              dotSizeByRadiation
                ? getSizeByRadiation(d.value)
                : MapConfig.CIRCLE.RADIUS
            );
            node.on("mouseover", () => {
              d3.select(map.current)
                .select("svg")
                .select("#contours")
                .append("text")
                .style("font-size", `${MapConfig.SENSORS.HOVER_TEXT_SIZE}px`)
                .style("z-index", "3")
                .attr("class", "pointText")
                .attr("x", xText)
                .attr("y", yText)
                .text(() => {
                  return `#${d["sensor-id"]} ${d.value.toFixed(2)}`;
                });
            });

            node.on("mouseout", () => {
              d3.select(map.current)
                .select("svg")
                .select(".pointText")
                .remove();
            });
          })
          .style("fill", (d, index, n) => {
            return `${colors[d["sensor-id"]]}`;
          });
      }
    }

    function drawUtilities(svg) {
      const base = d3.select(map.current).select("svg").select("#contours");
      base.selectAll(".utilities").remove();

      if (showUtilities) {
        MapConfig.UTILITIES.forEach((item) => {
          const x = scaleX(item.long),
            y = scaleY(item.lat);
          base
            .append("svg:image")
            .attr(
              "xlink:href",
              item.type === "hospital" ? "img/hospital.svg" : "img/plant.svg"
            )
            .attr("class", "utilities")
            .attr("width", "6%")
            .attr("height", "6%")
            .attr("x", x)
            .attr("y", y);
        });
      }
    }

    const mapElement = d3.select(map.current);

    if (map.current.children.length === 0) {
      drawMap(mapElement);
    }

    let svg = mapElement.select("svg");

    renderNames(svg);
    drawStaticSensors(svg);
    drawMobileSensors(svg);
    drawUtilities(svg);
  }, [
    selectedDate,
    data,
    showNames,
    showMobileSensors,
    showStaticSensors,
    colors,
    onStateSelect,
    dotSizeByRadiation,
    scaleX,
    scaleY,
    showUtilities,
  ]);

  React.useEffect(() => {
    if (map.current.children.length === 0) {
      return;
    }

    d3.select(map.current)
      .select("#base")
      .selectAll("path")
      .style("fill", "#fff");

    if (selectedState) {
      d3.select(map.current)
        .select(`#base_${selectedState}`)
        .style("fill", MapConfig.COLORS.SELECTED_STATE);
    }
  }, [selectedState]);

  React.useEffect(() => {
    if (Object.keys(textData).length > 0) {
      const base = d3.select(map.current).select("svg").select("#contours");

      base.selectAll(".mobile-text").remove();

      if (!showStateMobileValues) return;

      Object.keys(textData).forEach((key) => {
        const location = MapMobileTextLocation[key];
        const x = scaleX(location.long),
          y = scaleY(location.lat);

        let value = 0;

        if (textData[key].mobileHistory.length > 0) {
          const sum = textData[key].mobileHistory.reduce((accum, item) => {
            accum += item;
            return accum;
          }, 0);

          value = sum / textData[key].mobileHistory.length;
        }

        base
          .append("text")
          .attr("class", "mobile-text")
          .attr("x", x)
          .attr("y", y)
          .style("font-size", `${MapConfig.SENSORS.TEXT_SIZE}px`)
          .style("font-weight", "700")
          .style("fill", "steelblue")
          .text(`${value.toFixed(2)}`);
      });
    }
  }, [textData, scaleX, scaleY, showStateMobileValues]);

  React.useEffect(() => {
    if (Object.keys(textData).length > 0) {
      const base = d3.select(map.current).select("svg").select("#contours");

      base.selectAll(".static-text").remove();

      if (!showStateStaticValues) return;

      Object.keys(textData).forEach((key) => {
        const location = MapStaticTextLocation[key];

        if (MapStaticTextLocation[key]) {
          const x = scaleX(location.long),
            y = scaleY(location.lat);

          let value = 0;

          if (textData[key].staticHistory.length > 0) {
            const sum = textData[key].staticHistory.reduce((accum, item) => {
              accum += item;
              return accum;
            }, 0);

            value = sum / textData[key].staticHistory.length;
          }

          base
            .append("text")
            .attr("class", "static-text")
            .attr("x", x)
            .attr("y", y)
            .style("font-size", `${MapConfig.SENSORS.TEXT_SIZE}px`)
            .style("font-weight", "700")
            .style("fill", MapConfig.COLORS.STATIC)
            .text(`${value.toFixed(2)}`);
        }
      });
    }
  }, [textData, scaleX, scaleY, showStateStaticValues]);

  return <div className={className} ref={map}></div>;
}

export default CityMap;
