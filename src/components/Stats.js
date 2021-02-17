import React from "react";
import * as d3 from "d3";
import MapConfig from "../config";

const GraphConfig = {
  VIEW_BOX: {
    x: 0,
    y: 0,
    width: 1000,
    height: 500,
  },
  margin: { top: 20, right: 30, bottom: 30, left: 80 },
};

function Stats({
  id,
  data,
  className,
  size = "big",
  staticEnabled,
  mobileEnabled,
}) {
  const graph = React.useRef(null);

  React.useEffect(() => {
    const x = d3
        .scaleUtc()
        .domain(d3.extent(Object.keys(data), (d) => d))
        .range([
          GraphConfig.margin.left,
          GraphConfig.VIEW_BOX.width - GraphConfig.margin.right,
        ]),
      y = d3
        .scaleLinear()
        .domain([
          0,
          d3.max(Object.values(data), (d) => {
            const mobile = d.mobile || {};
            const staticSensor = d.static || {};
            const mobileValue = mobile.value || 0;
            const staticValue = staticSensor.value || 0;

            if (mobileValue > staticValue) return mobileValue;

            return staticValue;
          }),
        ])
        .nice()
        .range([
          GraphConfig.VIEW_BOX.height - GraphConfig.margin.bottom,
          GraphConfig.margin.top,
        ]),
      xAxis = (g) =>
        g
          .attr(
            "transform",
            `translate(0,${
              GraphConfig.VIEW_BOX.height - GraphConfig.margin.bottom
            })`
          )
          .call(
            d3
              .axisBottom(x)
              .ticks(GraphConfig.VIEW_BOX.width / 100)
              .tickSizeOuter(0)
          ),
      yAxis = (g) =>
        g
          .attr("transform", `translate(${GraphConfig.margin.left},0)`)
          .call(d3.axisLeft(y))
          .call((g) => g.select(".domain").remove())
          .call((g) =>
            g
              .select(".tick:last-of-type text")
              .clone()
              .attr("x", 3)
              .attr("text-anchor", "start")
              .attr("font-weight", "bold")
              .text("CPM")
          ),
      line = d3
        .line()
        .defined((d) => !isNaN(d.value))
        .x((d) => x(d.timestamp))
        .y((d) => y(d.value));

    if (graph.current.children.length > 0) {
      d3.select(graph.current).select("svg").remove("*");
    }

    const svg = d3
      .select(graph.current)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", Object.values(GraphConfig.VIEW_BOX));

    svg.append("g").call(xAxis).style("font-size", MapConfig.AXIS.FONT_SIZE);
    svg.append("g").call(yAxis).style("font-size", MapConfig.AXIS.FONT_SIZE);

    if (mobileEnabled) {
      svg
        .append("path")
        .datum(
          Object.keys(data).map((time) => {
            const mobile = data[time].mobile || {};

            return {
              value: mobile.value || 0,
              timestamp: time,
            };
          })
        )
        .attr("fill", "none")
        .attr("stroke", MapConfig.COLORS.MOBILE)
        .attr("stroke-width", size === "sm" ? 30 : 10)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", line);
    }

    if (staticEnabled) {
      svg
        .append("path")
        .datum(
          Object.keys(data).map((time) => {
            const item = data[time].static || {};

            return {
              value: item.value || 0,
              timestamp: time,
            };
          })
        )
        .attr("fill", "none")
        .attr("stroke", MapConfig.COLORS.STATIC)
        .attr("stroke-width", size === "sm" ? 30 : 10)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", line);
    }
  }, [data, staticEnabled, mobileEnabled]);
  return <div className={className} ref={graph}></div>;
}

export default Stats;
