import { FaPlayCircle, FaPauseCircle } from "react-icons/fa";

function Player({ running, onToggle }) {
  return (
    <div className="Player">
      <button className="Player-button" onClick={onToggle}>
        {running ? <FaPauseCircle size={30} /> : <FaPlayCircle size={30} />}
      </button>{" "}
      {running ? "PAUSE" : "PLAY"}
    </div>
  );
}

export default Player;
