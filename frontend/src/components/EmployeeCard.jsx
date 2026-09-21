import { useState } from "react";
import { formatCurrency, formatHours } from "../lib/formatters";
import { TimeSelect } from "./TimeSelect";

export function EmployeeCard({
  employee,
  index,
  canRemove,
  result,
  onChange,
  onRemove,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const hasMissingTime = !employee.startTime || !employee.endTime;
  const employeeName = employee.name.trim() || `Mitarbeiter ${index + 1}`;

  return (
    <article className="employee-card">
      <div className="employee-card-header">
        <div className="employee-card-title">
          <h3>{employeeName}</h3>
          {isCollapsed && !hasMissingTime ? (
            <span>{formatHours(result?.hours ?? 0)}</span>
          ) : null}
        </div>
        <button
          className="icon-toggle"
          type="button"
          aria-expanded={!isCollapsed}
          aria-label={
            isCollapsed
              ? `${employeeName} ausklappen`
              : `${employeeName} zuklappen`
          }
          onClick={() => setIsCollapsed((currentValue) => !currentValue)}
        >
          <span className="chevron" aria-hidden="true" />
        </button>
      </div>

      {isCollapsed ? null : (
        <>
          {canRemove ? (
            <button
              className="text-button"
              type="button"
              onClick={() => onRemove(employee.id)}
            >
              Entfernen
            </button>
          ) : null}

      <label className="field-label" htmlFor={`name-${employee.id}`}>
        Name
        <input
          id={`name-${employee.id}`}
          placeholder="Name"
          type="text"
          value={employee.name}
          onChange={(event) =>
            onChange(employee.id, { name: event.target.value })
          }
        />
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

      <label className="check-row" htmlFor={`cash-${employee.id}`}>
        <input
          id={`cash-${employee.id}`}
          checked={employee.paidInCash}
          type="checkbox"
          onChange={(event) =>
            onChange(employee.id, { paidInCash: event.target.checked })
          }
        />
        <span>Lohn wird bar ausgezahlt</span>
      </label>

      {employee.paidInCash ? (
        <div className="cash-wage-block">
          <label className="field-label" htmlFor={`hourly-wage-${employee.id}`}>
            Stundenlohn
            <input
              id={`hourly-wage-${employee.id}`}
              autoComplete="off"
              autoCorrect="off"
              inputMode="decimal"
              pattern="[0-9]*[,.]?[0-9]*"
              placeholder="0,00"
              type="text"
              value={employee.hourlyWage ?? ""}
              onChange={(event) =>
                onChange(employee.id, { hourlyWage: event.target.value })
              }
            />
          </label>

          <div className="hours-display">
            <span>Barlohn gesamt</span>
            <strong>{formatCurrency(result?.cashWage ?? 0)}</strong>
          </div>
        </div>
      ) : null}
        </>
      )}
    </article>
  );
}
