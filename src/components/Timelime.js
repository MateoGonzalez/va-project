import React from "react";
import * as d3 from "d3";
import sensorsData from "../assets/sensors-data";

const TimelineConfig = {
  height: 100,
  width: 1200,
  margin: { top: 20, right: 20, bottom: 20, left: 20 },
};

let time = Object.values(
  sensorsData.reduce((accum, item) => {
    accum[item.timestamp] = item.timestamp;

    return accum;
  }, {})
);

function Timelime({ onDateChange, currentDate }) {
  const elem = React.useRef(null);

  React.useEffect(() => {
    const { width, height, margin } = TimelineConfig,
      xF = d3
        .scaleUtc()
        .domain(d3.extent(time, (d) => d))
        .range([margin.left, width - margin.right]),
      xAxis = (g) =>
        g
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(xF).ticks(width / 200));

    function getNearestDate(x0) {
      const bisectDate = d3.bisector(function (d) {
        return d;
      }).left;
      const i = bisectDate(time, x0, 1),
        d0 = time[i - 1],
        d1 = time[i],
        d = x0 - d0 > d1 - x0 ? d1 : d0;

      return d;
    }

    function shouldUpdateTimeline(x) {
      return x - margin.left < 0 || x > width - margin.right;
    }

    function updateLine(id, x) {
      let svg = d3.select(elem.current);

      svg
        .select(id)
        .attr("x1", x)
        .attr("x2", x)
        .attr("y1", 0)
        .attr("y2", height);

      const txtX = getTextX(x);
      const date = xF.invert(x);

      svg.select("#lineText").attr("x", txtX).text(date.toLocaleString());
    }

    function addTextLine(element, id) {
      element
        .append("text")
        .attr("id", id)
        .attr("y", 12)
        .attr("pointer-events", "none")
        .style("font-size", "10px");
    }

    function initialize() {
      let svg = d3
        .select(elem.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "timeline")
        .attr("viewBox", [0, 0, width, height]);

      svg
        .append("g")
        .attr("id", "area")
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("stroke", "black")
        .attr("pointer-events", "all")
        .attr("fill", "none")
        .attr("stroke-dasharray", "5,5")
        .attr("stroke-width", 2)
        .on("mousemove", (event) => {
          const [[x, y] = []] = d3.pointers(event);

          if (shouldUpdateTimeline(x)) return;

          updateLine("#line", x);
        })
        .on("click", (event) => {
          const [[x, y] = []] = d3.pointers(event);

          if (shouldUpdateTimeline(x)) return;

          updateLine("#pivotLine", x);
          onDateChange(getNearestDate(xF.invert(x)));
        });

      svg
        .append("line")
        .attr("id", "line")
        .attr("stroke-width", "2px")
        .attr("pointer-events", "none")
        .attr("stroke", "black");

      svg
        .append("line")
        .attr("id", "pivotLine")
        .attr("x1", xF(currentDate))
        .attr("x2", xF(currentDate))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke-width", "2px")
        .attr("pointer-events", "none")
        .attr("stroke", "blue");

      addTextLine(svg, "lineText");
      addTextLine(svg, "pivotLineText");

      svg.append("g").call(xAxis);
    }

    function getTextX(x) {
      return x < width / 2 - margin.left ? x + 5 : x - 100;
    }

    if (elem.current.children.length === 0) {
      initialize();
    } else {
      let svg = d3.select(elem.current);
      const x = xF(currentDate);
      const txtX = getTextX(x);

      svg
        .select("#pivotLine")
        .attr("id", "pivotLine")
        .attr("x1", x)
        .attr("x2", x);

      svg
        .select("#pivotLineText")
        .attr("x", txtX)
        .text(new Date(currentDate).toLocaleString());
    }
  }, [currentDate, onDateChange]);

  return <div ref={elem}></div>;
}

export default Timelime;
