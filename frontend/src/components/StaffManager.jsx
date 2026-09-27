import { useState } from "react";

export function StaffManager({
  staffMembers,
  onAddStaffMember,
  onDeleteStaffMember,
}) {
  const [name, setName] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [paidCash, setPaidCash] = useState(false);
  const [selectedStaffMemberId, setSelectedStaffMemberId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const parsedHourlyRate = parsePositiveNumber(hourlyRate);

    if (!trimmedName) {
      setError("Bitte einen Namen eintragen.");
      return;
    }

    if (parsedHourlyRate === null) {
      setError("Bitte einen gültigen Stundenlohn eintragen.");
      return;
    }

    onAddStaffMember({
      name: trimmedName,
      hourlyRate: parsedHourlyRate,
      paidCash,
    });
    setName("");
    setHourlyRate("");
    setPaidCash(false);
    setError("");
  };

  const handleDeleteSelected = () => {
    const selectedStaffMember = staffMembers.find(
      (staffMember) => staffMember.id === selectedStaffMemberId,
    );

    if (!selectedStaffMember) {
      setError("Bitte einen Mitarbeiter auswählen.");
      return;
    }

    const shouldDelete = window.confirm(
      `Möchtest du ${selectedStaffMember.name} wirklich löschen?`,
    );

    if (shouldDelete) {
      onDeleteStaffMember(selectedStaffMember.id);
      setSelectedStaffMemberId("");
      setError("");
    }
  };

  return (
    <section className="staff-panel" aria-labelledby="staff-manager-heading">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Stammdaten</p>
          <h2 id="staff-manager-heading">Mitarbeiter verwalten</h2>
        </div>
      </div>

      <form className="staff-form" onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="staff-name">
          Name
          <input
            id="staff-name"
            autoComplete="name"
            placeholder="Max Mustermann"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <label className="field-label" htmlFor="staff-hourly-rate">
          Stundenlohn in EUR
          <input
            id="staff-hourly-rate"
            autoComplete="off"
            autoCorrect="off"
            inputMode="decimal"
            pattern="[0-9]*[,.]?[0-9]*"
            placeholder="14,50"
            type="text"
            value={hourlyRate}
            onChange={(event) => setHourlyRate(event.target.value)}
          />
        </label>

        <label className="check-row staff-check-row" htmlFor="staff-paid-cash">
          <input
            id="staff-paid-cash"
            checked={paidCash}
            type="checkbox"
            onChange={(event) => setPaidCash(event.target.checked)}
          />
          <span>Gehalt wird bar ausgezahlt</span>
        </label>

        {error ? <p className="field-hint">{error}</p> : null}

        <button className="add-button staff-submit-button" type="submit">
          Mitarbeiter speichern
        </button>
      </form>

      <div className="staff-divider" aria-hidden="true" />

      <div className="staff-delete-form">
        <label className="field-label" htmlFor="staff-delete-select">
          Mitarbeiter löschen
          <select
            id="staff-delete-select"
            disabled={staffMembers.length === 0}
            value={selectedStaffMemberId}
            onChange={(event) => {
              setSelectedStaffMemberId(event.target.value);
              setError("");
            }}
          >
            <option value="">
              {staffMembers.length === 0
                ? "Keine Mitarbeiter gespeichert"
                : "Mitarbeiter auswählen"}
            </option>
            {staffMembers.map((staffMember) => (
              <option key={staffMember.id} value={staffMember.id}>
                {staffMember.name}
              </option>
            ))}
          </select>
        </label>

        <button
          className="text-button danger-button"
          disabled={staffMembers.length === 0}
          type="button"
          onClick={handleDeleteSelected}
        >
          Mitarbeiter löschen
        </button>
      </div>
    </section>
  );
}

function parsePositiveNumber(value) {
  const number = Number(String(value).replace(",", "."));

  if (!Number.isFinite(number) || number < 0) {
    return null;
  }

  return number;
}
