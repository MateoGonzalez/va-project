import React from "react";

import "./App.css";
import CityMap from "./components/CityMap";
import Timeline from "./components/Timelime";
import Player from "./components/Player";

import GraphTable from "./components/GraphTable";

import { useInterval, diffMinutes } from "./tools/helpers";
import allSensorsData from "./assets/sensors-data";
import mapData from "./assets/map-data";
import Switch from "react-bootstrap/Switch";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger"
import Tooltip from "react-bootstrap/Tooltip"

import { FaCheck, FaExclamationTriangle } from "react-icons/fa";
import MapConfig from "./config";

const PLAY_TIME = 2000;

let time = Object.values(
  allSensorsData.reduce((accum, item) => {
    accum[item.timestamp] = item.timestamp;
    return accum;
  }, {})
);

const mobileData = allSensorsData.filter((item) => {
  item["user-id"] = item["user-id"].trim();

  return item.type === "mobile";
});

function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const sensorsType = Object.values(
  mobileData.reduce((accum, item) => {
    if (!accum[item["sensor-id"]]) {
      accum[item["sensor-id"]] = {
        "sensor-id": item["sensor-id"],
        "user-id": item["user-id"],
      };
    }

    return accum;
  }, {})
);

const colors = sensorsType.reduce((accum, item) => {
  accum[item["sensor-id"]] = getRandomColor();

  return accum;
}, {});

function getSensorsData(params) {
  return allSensorsData;
}

function App() {
  const [date, setDate] = React.useState(time[0]);
  const [mobileSensorsData, setMobileData] = React.useState([]);
  const [namesEnabled, setNamesCheck] = React.useState(true);
  const [showUtilities, setShowUtilities] = React.useState(false);
  const [staticEnabled, setStaticCheck] = React.useState(true);
  const [mobileEnabled, setMobileCheck] = React.useState(true);
  const [staticEnabledOnMap, setStaticOnMapCheck] = React.useState(false);
  const [mobileEnabledOnMap, setMobileOnMapCheck] = React.useState(false);
  const [cityMobileValuesEnabled, setCityMobileValuesEnabled] = React.useState(
    true
  );
  const [cityStaticValuesEnabled, setCityStaticValuesEnabled] = React.useState(
    true
  );
  const [showTrajectories, setShowTrajectories] = React.useState(false);
  const [dotSizeByRadiation, setDotSizeByRadiation] = React.useState(false);
  const [selectedMobileSensors, setSelectedMobileSensors] = React.useState(() =>
    Object.values(sensorsType).map((item) => item["sensor-id"])
  );
  const [selectedState, setSelectedState] = React.useState(null);
  const [max, setMax] = React.useState({ value: 0 });
  const [min, setMin] = React.useState({ value: 0 });
  const [selectedData, setSelectedData] = React.useState({});
  const [timeDiff, setTimeDiff] = React.useState(60);

  const [toggle, running] = useInterval(() => {
    setNextTime();
  }, PLAY_TIME);

  React.useEffect(() => {
    const filteredData = mobileData.filter((item) => {
      let condition = selectedMobileSensors.includes(item["sensor-id"]);

      if (showTrajectories) {
        condition = condition && item.timestamp <= date;
      } else {
        condition = condition && item.timestamp === date;
      }

      return condition;
    });

    setMobileData(filteredData);
  }, [setMobileData, date, selectedMobileSensors, showTrajectories]);

  React.useEffect(() => {
    let minItem = { value: +Infinity };
    let maxItem = { value: -Infinity };

    const filteredData = allSensorsData.reduce((accum, item) => {
      const diff = diffMinutes(new Date(date), new Date(item.timestamp));

      if (
        (item.type === "static" && !staticEnabled) ||
        (item.type === "mobile" && !mobileEnabled)
      ) {
        return accum;
      }

      if (item.region > 0 && diff <= timeDiff && diff >= 0) {
        const base = mapData.layers[3];
        const elIndex = item.region;

        if (!accum[elIndex]) {
          accum[elIndex] = {
            times: {
              [item.timestamp]: [item],
            },
            region: elIndex,
            name: base.paths[item.region - 1].name,
          };
        } else {
          const current = accum[elIndex].times;

          if (current[item.timestamp]) {
            current[item.timestamp].push(item);
          } else {
            current[item.timestamp] = [item];
          }
        }
      }
      return accum;
    }, {});

    const computedData = Object.keys(filteredData).reduce((accum, cityKey) => {
      const city = filteredData[cityKey];
      accum[cityKey] = {};
      accum[cityKey].mobileHistory = [];
      accum[cityKey].staticHistory = [];

      accum[cityKey].times = Object.keys(city.times).reduce(
        (cityAccum, timeKey) => {
          const timeArray = city.times[timeKey];

          cityAccum[timeKey] = {};

          cityAccum[timeKey] = timeArray.reduce((timeAccum, sensor) => {
            if (!timeAccum[sensor["type"]]) {
              timeAccum[sensor["type"]] = {};
              timeAccum[sensor["type"]].value = sensor.value;
              timeAccum[sensor["type"]].count = 1;
            } else {
              timeAccum[sensor["type"]].value += sensor.value;
              timeAccum[sensor["type"]].count++;
            }

            return timeAccum;
          }, {});

          if (
            cityAccum[timeKey]["mobile"] &&
            cityAccum[timeKey]["mobile"].count &&
            cityAccum[timeKey]["mobile"].count >= 1
          ) {
            const value =
              cityAccum[timeKey]["mobile"].value /
              cityAccum[timeKey]["mobile"].count;

            if (value < minItem.value) {
              minItem = {};
              minItem.value = value;
              minItem.region = city.region;
            }

            if (value > maxItem.value) {
              maxItem = {};
              maxItem.value = value;
              maxItem.region = city.region;
            }

            cityAccum[timeKey]["mobile"] = {
              ...cityAccum[timeKey]["mobile"],
              value,
            };
            accum[cityKey].mobileHistory.push(value);
          }

          if (
            cityAccum[timeKey]["static"] &&
            cityAccum[timeKey]["static"].count &&
            cityAccum[timeKey]["static"].count >= 1
          ) {
            const value =
              cityAccum[timeKey]["static"].value /
              cityAccum[timeKey]["static"].count;

            if (value < minItem.value) {
              minItem = {};
              minItem.value = value;
              minItem.region = city.region;
            }

            if (value > maxItem.value) {
              maxItem = {};
              maxItem.value = value;
              maxItem.region = city.region;
            }

            cityAccum[timeKey]["static"] = {
              ...cityAccum[timeKey]["static"],
              value,
            };

            accum[cityKey].staticHistory.push(value);
          }

          return cityAccum;
        },
        {}
      );

      accum[cityKey].name = city.name;
      accum[cityKey].id = city.id;

      return accum;
    }, {});

    setSelectedData(computedData);
    setMin(minItem);
    setMax(maxItem);
  }, [
    date,
    setSelectedData,
    setMin,
    setMax,
    staticEnabled,
    mobileEnabled,
    timeDiff,
  ]);

  function updateData(newDate) {
    setDate(newDate);
  }

  function setNextTime() {
    const currentIndex = time.findIndex((item) => item === date);

    if (currentIndex + 1 < time.length) {
      return updateData(time[currentIndex + 1]);
    }

    updateData(time[0]);
  }

  function onMobileSensorsTypeChange(event) {
    let value = Array.from(event.target.selectedOptions, (option) => {
      return parseInt(option.value);
    });

    setSelectedMobileSensors(value);
  }

  function onSelectAllMobileSensors() {
    setSelectedMobileSensors(
      Object.values(sensorsType).map((item) => item["sensor-id"])
    );
  }

  function onStateSelect(id) {
    setSelectedState(id);
  }

  function OnClickRegionFromSummary(regionId) {
    if (Object.keys(selectedData).length > 0) {
      onStateSelect(regionId);
    }
  }

  return (
    <div className="App">
      <div className="Navbar">
        <h2 className="Navbar-title">Radiation Monitor</h2>
      </div>
      <div className="Resume">
        <div className="Resume-global-state">
          <div className="Resume-global-state-container">
            {(max.value === -Infinity || max.value <= 65) && (
              <>
                <div className="Resume-global-state-symbol positive">
                  <FaCheck className="Resume-global-state-mark" size={50} />
                </div>
                <h3 className="Resume-global-state-text normal">All good!</h3>
              </>
            )}

            {max.value > 65 && max.value < 1000 && (
              <>
                <div className="Resume-global-state-symbol warning">
                  <FaExclamationTriangle
                    className="Resume-global-state-mark"
                    size={50}
                  />
                </div>
                <h3 className="Resume-global-state-text warning">Watch out!</h3>
              </>
            )}

            {max.value >= 1000 && (
              <>
                <div className="Resume-global-state-symbol danger">
                  <FaExclamationTriangle
                    className="Resume-global-state-mark"
                    size={50}
                  />
                </div>
                <h3 className="Resume-global-state-text danger">Danger!</h3>
              </>
            )}
          </div>
        </div>
        <div className="Map-GraphTable-summary">
          <div className="Map-GraphTable-summary-max">
            <div className="Map-GraphTable-summary-type">
              <b>Higuest</b>
            </div>
            <div
              className="Map-GraphTable-summary-max-value"
              onClick={() => OnClickRegionFromSummary(max.region)}
            >
              <div className="Map-GraphTable-summary-value-container">
                <span className="Map-GraphTable-summary-value">
                  {max.value !== -Infinity ? max.value.toFixed(2) : 0}
                </span>
              </div>
            </div>
            <div className="Map-GraphTable-summary-max-region">
              {Object.keys(selectedData).length > 0 &&
                selectedData[max.region].name}
            </div>
            <div className="Map-GraphTable-summary-min-type">{max.type}</div>
          </div>
          <div className="Map-GraphTable-summary-min">
            <div className="Map-GraphTable-summary-type">
              <b>Lowest</b>
            </div>
            <div
              className="Map-GraphTable-summary-min-value"
              onClick={() => OnClickRegionFromSummary(min.region)}
            >
              <div className="Map-GraphTable-summary-value-container">
                <span className="Map-GraphTable-summary-value">
                  {min.value !== Infinity ? min.value.toFixed(2) : 0}
                </span>
              </div>
            </div>
            <div className="Map-GraphTable-summary-min-region">
              {Object.keys(selectedData).length > 0 &&
                selectedData[min.region].name}
            </div>
            <div className="Map-GraphTable-summary-min-type">{min.type}</div>
          </div>
        </div>
      </div>
      <div className="Row Map-container"> 
        <div className="Map-toolbox">
          <h3>Toolbox</h3>
          <Switch
            id="namesSwitch"
            label="Show Cities Names"
            checked={namesEnabled}
            onChange={() => setNamesCheck((old) => !old)}
          />
          <Switch
            id="utilitiesSwitch"
            label="Show Cities Utilities"
            checked={showUtilities}
            onChange={() => setShowUtilities((old) => !old)}
          />
          <hr></hr>
          <Switch
            id="staticSwitch"
            label="Static sensors"
            checked={staticEnabled}
            onChange={() => {
              setStaticCheck((old) => !old);
              setCityStaticValuesEnabled((old) => false);
              setStaticOnMapCheck((old) => false);
            }}
          />
          <div class="Map-toolbox-static-options">
            <Switch
              id="cityStaticValues"
              label="Show Cities Static Measures"
              disabled = {staticEnabled ? false : true}
              checked={staticEnabled ? cityStaticValuesEnabled : false}
              onChange={() => setCityStaticValuesEnabled((old) => !old)}
            />
            <Switch
              id="showStaticSwitch"
              label="Show Static Sensors Locations"
              disabled = {staticEnabled ? false : true}
              checked={staticEnabled ? staticEnabledOnMap : false}
              onChange={() => setStaticOnMapCheck((old) => !old)}
            />
          </div>
          <hr></hr>
          <Switch
            id="mobileSwitch"
            label="Mobile sensors"
            checked={mobileEnabled}
            onChange={() => {
              setMobileCheck((old) => !old);
              setCityMobileValuesEnabled((old) => false);
              setMobileOnMapCheck((old) => false);
              setDotSizeByRadiation((old) => false);
              setShowTrajectories((old) => false)
            }}
          />
          <div class="Map-toolbox-mobile-options">
            <Switch
              id="cityMobileValues"
              label="Show City mobile Values"
              disabled = {mobileEnabled ? false : true}
              checked={mobileEnabled ? cityMobileValuesEnabled : false}
              onChange={() => setCityMobileValuesEnabled((old) => !old)}
            />
            <Switch
              id="showMobileSwitch"
              label="Show Mobile Sensors Locations"
              disabled = {mobileEnabled ? false : true}
              checked={mobileEnabled ? mobileEnabledOnMap : false}
              onChange={() => setMobileOnMapCheck((old) => !old)}
            />
            <div class="Map-toolbox-mobile-options-show-tweaks">
              <Switch
                id="enablePointsThickness"
                label="Dot size by ratiation"
                disabled = {mobileEnabled && mobileEnabledOnMap ? false : true}
                checked={mobileEnabled && mobileEnabledOnMap ? dotSizeByRadiation : false}
                onChange={() => setDotSizeByRadiation((old) => !old)}
              />
              <OverlayTrigger
                key="mapped-trajectory"
                placement="bottom"
                overlay={
                  <Tooltip id="mapped-trajectory-tooltip">
                    Player must be <strong>{"stopped"}</strong>.
                  </Tooltip>
                }
              >
              <div class="Map-toolbox-mobile-options-show-tweaks-mappedtrajectory">
                <Switch
                  id="enableTrajectories"
                  label="Mapped trajectories"
                  disabled = {mobileEnabled && mobileEnabledOnMap && !running ? false : true}
                  checked={showTrajectories}
                  onChange={() => setShowTrajectories((old) => !old)}
                />
              </div>
              </OverlayTrigger>
            </div>
            <div className="Map-toolbox-mobile-types">
              <>
                <Form.Group>
                  <Form.Label>
                    Available Mobile Sensors:
                  </Form.Label>
                  <Form.Control
                    as="select"
                    multiple
                    value={selectedMobileSensors}
                    disabled = {mobileEnabled ? false : true}
                    onChange={onMobileSensorsTypeChange}
                  >
                    {Object.keys(sensorsType).map((current) => {
                      const item = sensorsType[current];
                      return (
                        <option
                          key={item["sensor-id"]}
                          value={item["sensor-id"]}
                          style={{
                            borderLeft: `50px solid ${
                              colors[item["sensor-id"]]
                            }`,
                          }}
                        >
                          {item["sensor-id"]}-{item["user-id"]}
                        </option>
                      );
                    })}
                  </Form.Control>
                </Form.Group>
                {selectedMobileSensors.length !== sensorsType.length && (
                  <Button 
                    onClick={onSelectAllMobileSensors}
                    variant="primary"
                    disabled = {mobileEnabled ? false : true}
                  >
                  Select All
                  </Button>
                )}
              </>
            </div>
          </div>
        </div>
        <div className="CityMap-Container">
          <div className="City-legend">
            <div className="City-legend-color-container">
              Static sensors{" "}
              <span
                className="City-legend-color"
                style={{
                  backgroundColor: MapConfig.COLORS.STATIC,
                }}
              ></span>
            </div>
            <div className="City-legend-color-container">
              Mobile sensors{" "}
              <span
                className="City-legend-color"
                style={{
                  backgroundColor: MapConfig.COLORS.MOBILE,
                }}
              ></span>
            </div>
          </div>
          <CityMap
            className="Map"
            selectedDate={date}
            data={mobileSensorsData}
            showNames={namesEnabled}
            showMobileSensors={mobileEnabledOnMap}
            showStaticSensors={staticEnabledOnMap}
            colors={colors}
            onStateSelect={onStateSelect}
            selectedState={selectedState}
            dotSizeByRadiation={dotSizeByRadiation}
            textData={selectedData}
            showStateMobileValues={cityMobileValuesEnabled}
            showStateStaticValues={cityStaticValuesEnabled}
            showUtilities={showUtilities}
          />
        </div>
        <div className="Container Stats-Container">
          <GraphTable
            selectedData={selectedData}
            date={date}
            onStateSelection={onStateSelect}
            selectedState={selectedState}
            staticEnabled={staticEnabled}
            mobileEnabled={mobileEnabled}
            timeDiff={timeDiff}
            setTimeDiff={setTimeDiff}
          />
        </div>
      </div>
      <div className="Row Timeline-container">
        <div className="Timeline-container-panel">
          <div className="Player-container">
            {!showTrajectories && (
              <Player running={running} onToggle={() => toggle()} />
            )}
          </div>
          <Timeline onDateChange={updateData} currentDate={date} />
        </div>
      </div>
    </div>
  );
}

export default App;
