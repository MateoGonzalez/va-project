import React from "react";

export function useInterval(callback, delay) {
  const savedCallback = React.useRef();
  const intervalId = React.useRef(null);
  const [currentDelay, setDelay] = React.useState(null);

  const toggleRunning = React.useCallback(
    () => setDelay((currentDelay) => (currentDelay === null ? delay : null)),
    [delay]
  );

  const clear = React.useCallback(() => clearInterval(intervalId.current), []);

  React.useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  React.useEffect(() => {
    function tick() {
      savedCallback.current();
    }

    if (intervalId.current) clear();

    if (currentDelay !== null) {
      intervalId.current = setInterval(tick, currentDelay);
    }

    return clear;
  }, [currentDelay, clear]);

  return [toggleRunning, !!currentDelay];
}

export function diffMinutes(dt2, dt1) {
  let diff = (dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60;

  return Math.round(diff);
}
