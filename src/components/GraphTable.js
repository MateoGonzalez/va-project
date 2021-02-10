import * as d3 from "d3";
import React from "react";
import Stats from "./Stats";
import HistoryDifference from "./HistoryDifference";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import { FaArrowLeft } from "react-icons/fa";

function GraphTable({
  reginons = {},
  selectedState,
  onStateSelection,
  staticEnabled,
  mobileEnabled,
  selectedData = {},
  timeDiff,
  setTimeDiff,
}) {
  function getBadgeClass(time) {
    return timeDiff === time ? "primary" : "secondary";
  }

  function onBagdeClick(time) {
    return setTimeDiff(time);
  }

  function onItemClick(id) {
    onStateSelection(id);
  }

  console.log("::TEST", selectedData[selectedState]);

  return (
    <div>
      <div className="Map-GraphTable-minutes">
        <Badge
          onClick={() => onBagdeClick(30)}
          className="Badge"
          variant={getBadgeClass(30)}
        >
          30 min
        </Badge>
        <Badge
          onClick={() => onBagdeClick(60)}
          className="Badge"
          variant={getBadgeClass(60)}
        >
          60 min
        </Badge>
        <Badge
          onClick={() => onBagdeClick(120)}
          className="Badge"
          variant={getBadgeClass(120)}
        >
          120 min
        </Badge>
      </div>
      {selectedData[selectedState] ? (
        <div className="Map-GraphTable-detail">
          <Button
            className="BackButton"
            variant="dark"
            size="sm"
            onClick={() => {
              onItemClick(null);
            }}
          >
            <FaArrowLeft size={20} />
          </Button>
          <h4>{selectedData[selectedState].name}</h4>
          <Stats
            className="Map-graph-detail"
            id={selectedData[selectedState].id}
            data={selectedData[selectedState].times}
            staticEnabled={staticEnabled}
            mobileEnabled={mobileEnabled}
          ></Stats>
        </div>
      ) : (
        <div className="Map-GraphTable">
          <ul>
            {Object.keys(selectedData).map((itemId) => {
              const city = selectedData[itemId];

              return (
                <li
                  className="Map-GraphTable-item"
                  key={itemId}
                  onClick={() => onItemClick(itemId)}
                >
                  <span className="Map-GraphTable-item-name">{city.name}</span>
                  {Object.keys(city.times).length && (
                    <>
                      <Stats
                        className="Map-graph-mini"
                        id={city.id}
                        data={city.times}
                        size="sm"
                        staticEnabled={staticEnabled}
                        mobileEnabled={mobileEnabled}
                      ></Stats>
                    </>
                  )}
                  {Object.keys(city.times).length && (
                    <HistoryDifference city={city} />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default GraphTable;
