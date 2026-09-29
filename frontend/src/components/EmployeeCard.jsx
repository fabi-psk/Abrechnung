import { formatCurrency, formatHours } from "../lib/formatters";
import { TimeSelect } from "./TimeSelect";

export function EmployeeCard({
  employee,
  index,
  canRemove,
  isExpanded,
  isDuplicate,
  result,
  staffMembers,
  onChange,
  onRemove,
  onSelectStaffMember,
  onToggle,
}) {
  const hasMissingTime = !employee.startTime || !employee.endTime;
  const employeeName = employee.name.trim() || `Mitarbeiter ${index + 1}`;
  const selectedStaffMember = staffMembers.find(
    (staffMember) => staffMember.id === employee.staffMemberId,
  );
  const selectedStaffMemberId = selectedStaffMember
    ? employee.staffMemberId
    : "";
  const canReceiveCashWage = Boolean(selectedStaffMember?.paidCash);

  return (
    <article
      className={`employee-card${isDuplicate ? " employee-card-warning" : ""}`}
    >
      <div className="employee-card-header">
        <div className="employee-card-title">
          <h3>{employeeName}</h3>
          {canReceiveCashWage ? <span className="cash-badge">Barlohn</span> : null}
          {!isExpanded && !hasMissingTime ? (
            <span>{formatHours(result?.hours ?? 0)}</span>
          ) : null}
        </div>
        <button
          className="icon-toggle"
          data-employee-toggle-id={employee.id}
          type="button"
          aria-expanded={isExpanded}
          aria-label={
            isExpanded
              ? `${employeeName} zuklappen`
              : `${employeeName} ausklappen`
          }
          onClick={(event) =>
            onToggle(employee.id, event.currentTarget.getBoundingClientRect().top)
          }
        >
          <span className="chevron" aria-hidden="true" />
        </button>
      </div>

      {!isExpanded ? null : (
        <>
          <label className="field-label" htmlFor={`staff-member-${employee.id}`}>
            <select
              id={`staff-member-${employee.id}`}
              aria-label="Mitarbeiter auswählen"
              disabled={staffMembers.length === 0}
              value={selectedStaffMemberId}
              onChange={(event) =>
                onSelectStaffMember(employee.id, event.target.value)
              }
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

      <div className="time-grid">
        <TimeSelect
          id={`start-${employee.id}`}
          invalid={hasMissingTime && !employee.startTime}
          label="Arbeitsbeginn"
          value={employee.startTime}
          onChange={(value) => onChange(employee.id, { startTime: value })}
        />

        <TimeSelect
          id={`end-${employee.id}`}
          invalid={hasMissingTime && !employee.endTime}
          label="Arbeitsende"
          value={employee.endTime}
          onChange={(value) => onChange(employee.id, { endTime: value })}
        />
      </div>

      <div className="hours-display">
        <span>Arbeitszeit</span>
        <strong>{formatHours(result?.hours ?? 0)}</strong>
      </div>

      {hasMissingTime ? (
        <p className="field-hint">Bitte Beginn und Ende eintragen.</p>
      ) : null}

      {isDuplicate ? (
        <p className="field-hint">Dieser Mitarbeiter ist mehrfach eingetragen.</p>
      ) : null}

      {canReceiveCashWage ? (
        <div className="cash-wage-block">
          <label className="check-row" htmlFor={`wage-paid-out-${employee.id}`}>
            <input
              id={`wage-paid-out-${employee.id}`}
              checked={Boolean(employee.wagePaidOut)}
              type="checkbox"
              onChange={(event) =>
                onChange(employee.id, { wagePaidOut: event.target.checked })
              }
            />
            <span>Lohn wurde ausgezahlt</span>
          </label>

          <div className="hours-display">
            <span>Barlohn gesamt</span>
            <strong>{formatCurrency(result?.cashWage ?? 0)}</strong>
          </div>
        </div>
      ) : null}

          {canRemove ? (
            <button
              className="text-button danger-button"
              type="button"
              onClick={() => onRemove(employee.id)}
            >
              Entfernen
            </button>
          ) : null}
        </>
      )}
    </article>
  );
}
