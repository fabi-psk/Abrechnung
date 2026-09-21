const HOURS = [
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "00",
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
];
const MINUTES = ["00", "15", "30", "45"];

export function TimeSelect({ id, label, value, invalid, onChange }) {
  const [selectedHour = "", selectedMinute = ""] = value
    ? value.split(":")
    : [];

  const updateTime = (nextHour, nextMinute) => {
    if (!nextHour && !nextMinute) {
      onChange("");
      return;
    }

    onChange(`${nextHour || "00"}:${nextMinute || "00"}`);
  };

  return (
    <fieldset className={`time-select ${invalid ? "invalid" : ""}`}>
      <legend>{label}</legend>
      <div className="time-select-controls">
        <label htmlFor={`${id}-hour`}>
          <span>Std.</span>
          <select
            id={`${id}-hour`}
            value={selectedHour}
            onChange={(event) => updateTime(event.target.value, selectedMinute)}
          >
            <option value="">--</option>
            {HOURS.map((hour) => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </select>
        </label>

        <span className="time-separator">:</span>

        <label htmlFor={`${id}-minute`}>
          <span>Min.</span>
          <select
            id={`${id}-minute`}
            value={selectedMinute}
            onChange={(event) => updateTime(selectedHour, event.target.value)}
          >
            <option value="">--</option>
            {MINUTES.map((minute) => (
              <option key={minute} value={minute}>
                {minute}
              </option>
            ))}
          </select>
        </label>

        <button
          className="time-clear-button"
          disabled={!value}
          type="button"
          onClick={() => onChange("")}
        >
          Löschen
        </button>
      </div>
    </fieldset>
  );
}
