export default function HistoryDifference({ city }) {
  function getDiffValue(history = []) {
    if (history.length === 0) {
      return 0;
    }

    if (history.length > 1) {
      return history[history.length - 1] - history[history.length - 2];
    }

    return history[0];
  }

  let mobileValue = getDiffValue(city.mobileHistory).toFixed(2);
  let staticValue = getDiffValue(city.staticHistory).toFixed(2);

  return (
    <div className="Map-graph-diff">
      <div>
        Mobile:{" "}
        <b
          style={{
            color:
              mobileValue > 0 ? "red" : mobileValue < 0 ? "green" : "black",
          }}
        >
          {mobileValue > 0 ? `+${mobileValue}` : mobileValue}
        </b>
      </div>
      <div>
        Static:{" "}
        <b
          style={{
            color:
              mobileValue > 0 ? "red" : mobileValue < 0 ? "green" : "black",
          }}
        >
          {staticValue > 0 ? `+${staticValue}` : staticValue}
        </b>
      </div>
    </div>
  );
}
