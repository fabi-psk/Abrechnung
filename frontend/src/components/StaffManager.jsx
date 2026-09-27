import { useEffect, useState } from "react";

export function StaffManager({
  staffMembers,
  onAddStaffMember,
  onUpdateStaffMember,
  onDeleteStaffMember,
}) {
  const [name, setName] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [paidCash, setPaidCash] = useState(false);
  const [selectedStaffMemberId, setSelectedStaffMemberId] = useState("");
  const [editName, setEditName] = useState("");
  const [editHourlyRate, setEditHourlyRate] = useState("");
  const [editPaidCash, setEditPaidCash] = useState(false);
  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");

  const selectedStaffMember = staffMembers.find(
    (staffMember) => staffMember.id === selectedStaffMemberId,
  );

  useEffect(() => {
    if (!selectedStaffMember) {
      setEditName("");
      setEditHourlyRate("");
      setEditPaidCash(false);
      return;
    }

    setEditName(selectedStaffMember.name);
    setEditHourlyRate(formatHourlyRateInput(selectedStaffMember.hourlyRate));
    setEditPaidCash(selectedStaffMember.paidCash);
    setEditError("");
  }, [selectedStaffMember]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const parsedHourlyRate = paidCash ? parsePositiveNumber(hourlyRate) : 0;

    if (!trimmedName) {
      setError("Bitte einen Namen eintragen.");
      return;
    }

    if (paidCash && parsedHourlyRate === null) {
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

  const handleUpdateSelected = (event) => {
    event.preventDefault();

    if (!selectedStaffMember) {
      setEditError("Bitte einen Mitarbeiter auswählen.");
      return;
    }

    const trimmedName = editName.trim();
    const parsedHourlyRate = editPaidCash
      ? parsePositiveNumber(editHourlyRate)
      : 0;

    if (!trimmedName) {
      setEditError("Bitte einen Namen eintragen.");
      return;
    }

    if (editPaidCash && parsedHourlyRate === null) {
      setEditError("Bitte einen gültigen Stundenlohn eintragen.");
      return;
    }

    onUpdateStaffMember(selectedStaffMember.id, {
      name: trimmedName,
      hourlyRate: parsedHourlyRate,
      paidCash: editPaidCash,
    });
    setEditError("");
  };

  const handleDeleteSelected = () => {
    if (!selectedStaffMember) {
      setEditError("Bitte einen Mitarbeiter auswählen.");
      return;
    }

    const shouldDelete = window.confirm("Mitarbeiter wirklich löschen?");

    if (shouldDelete) {
      onDeleteStaffMember(selectedStaffMember.id);
      setSelectedStaffMemberId("");
      setEditError("");
    }
  };

  return (
    <section className="staff-panel" aria-labelledby="staff-manager-heading">
      <div className="section-heading">
        <h2 id="staff-manager-heading">Mitarbeiter verwalten</h2>
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

        <label className="check-row staff-check-row" htmlFor="staff-paid-cash">
          <input
            id="staff-paid-cash"
            checked={paidCash}
            type="checkbox"
            onChange={(event) => {
              setPaidCash(event.target.checked);
              setError("");
            }}
          />
          <span>Gehalt wird bar ausgezahlt</span>
        </label>

        {paidCash ? (
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
        ) : null}

        {error ? <p className="field-hint">{error}</p> : null}

        <button className="add-button staff-submit-button" type="submit">
          Mitarbeiter speichern
        </button>
      </form>

      <div className="staff-divider" aria-hidden="true" />

      <form className="staff-edit-form" onSubmit={handleUpdateSelected}>
        <label className="field-label" htmlFor="staff-edit-select">
          Mitarbeiter bearbeiten oder löschen
          <select
            id="staff-edit-select"
            disabled={staffMembers.length === 0}
            value={selectedStaffMemberId}
            onChange={(event) => {
              setSelectedStaffMemberId(event.target.value);
              setEditError("");
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

        {selectedStaffMember ? (
          <>
            <label className="field-label" htmlFor="staff-edit-name">
              Name
              <input
                id="staff-edit-name"
                autoComplete="name"
                type="text"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
              />
            </label>

            <label
              className="check-row staff-check-row"
              htmlFor="staff-edit-paid-cash"
            >
              <input
                id="staff-edit-paid-cash"
                checked={editPaidCash}
                type="checkbox"
                onChange={(event) => {
                  setEditPaidCash(event.target.checked);
                  setEditError("");
                }}
              />
              <span>Gehalt wird bar ausgezahlt</span>
            </label>

            {editPaidCash ? (
              <label className="field-label" htmlFor="staff-edit-hourly-rate">
                Stundenlohn in EUR
                <input
                  id="staff-edit-hourly-rate"
                  autoComplete="off"
                  autoCorrect="off"
                  inputMode="decimal"
                  pattern="[0-9]*[,.]?[0-9]*"
                  type="text"
                  value={editHourlyRate}
                  onChange={(event) => setEditHourlyRate(event.target.value)}
                />
              </label>
            ) : null}
          </>
        ) : null}

        {editError ? <p className="field-hint">{editError}</p> : null}

        <div className="staff-edit-actions">
          <button
            className="add-button"
            disabled={!selectedStaffMember}
            type="submit"
          >
            Änderungen speichern
          </button>
          <button
            className="text-button danger-button"
            disabled={!selectedStaffMember}
            type="button"
            onClick={handleDeleteSelected}
          >
            Mitarbeiter löschen
          </button>
        </div>
      </form>
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

function formatHourlyRateInput(value) {
  return String(value).replace(".", ",");
}
