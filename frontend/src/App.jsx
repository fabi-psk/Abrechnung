import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { EmployeeCard } from "./components/EmployeeCard";
import { SettlementSummary } from "./components/SettlementSummary";
import { StaffManager } from "./components/StaffManager";
import { calculateSettlement } from "./lib/calculations";
import { printSettlementReceipt } from "./services/epsonPrinter";
import {
  createStaffMember,
  loadStaffMembers,
  saveStaffMembers,
  sortStaffMembers,
} from "./lib/staffStorage";
import { loadSettlementDraft, saveSettlementDraft } from "./lib/settlementDraft";
import "./styles.css";

const MIN_EMPLOYEES = 2;
const MAX_EMPLOYEES = 6;
let nextEmployeeId = 1;

const createEmployee = (index) => ({
  id: `employee-${nextEmployeeId++}`,
  name: `Mitarbeiter ${index}`,
  staffMemberId: "",
  startTime: "",
  endTime: "",
  paidInCash: false,
  wagePaidOut: false,
  hourlyWage: "",
});

const prepareDraftEmployees = (draftEmployees) => {
  const highestDraftEmployeeId = draftEmployees.reduce((highestId, employee) => {
    const match = /^employee-(\d+)$/.exec(employee.id);

    if (!match) {
      return highestId;
    }

    return Math.max(highestId, Number(match[1]));
  }, 0);

  nextEmployeeId = Math.max(nextEmployeeId, highestDraftEmployeeId + 1);
  return draftEmployees;
};

const createInitialEmployees = () => [createEmployee(1), createEmployee(2)];
const createWeekdayEmployees = () => [
  { ...createEmployee(1), startTime: "18:30" },
  { ...createEmployee(2), startTime: "19:30" },
];
const createWeekendEmployees = () =>
  ["18:30", "18:30", "19:30", "20:00", "20:30", "21:00"].map(
    (startTime, index) => ({
      ...createEmployee(index + 1),
      startTime,
    }),
  );

function App() {
  const [initialDraft] = useState(loadSettlementDraft);
  const [cashRevenue, setCashRevenue] = useState(
    () => initialDraft?.cashRevenue ?? "",
  );
  const [amountToSubmit, setAmountToSubmit] = useState(
    () => initialDraft?.amountToSubmit ?? "",
  );
  const [employees, setEmployees] = useState(
    () =>
      initialDraft?.employees
        ? prepareDraftEmployees(initialDraft.employees)
        : createInitialEmployees(),
  );
  const [staffMembers, setStaffMembers] = useState(loadStaffMembers);
  const [isStaffManagerOpen, setIsStaffManagerOpen] = useState(false);
  const [expandedEmployeeId, setExpandedEmployeeId] = useState(null);
  const [activePreset, setActivePreset] = useState(
    () => initialDraft?.activePreset ?? null,
  );
  const [epsonPrintStatus, setEpsonPrintStatus] = useState("idle");
  const pendingToggleAnchorRef = useRef(null);

  useEffect(() => {
    saveStaffMembers(staffMembers);
  }, [staffMembers]);

  useEffect(() => {
    saveSettlementDraft({
      cashRevenue,
      amountToSubmit,
      employees,
      activePreset,
    });
  }, [cashRevenue, amountToSubmit, employees, activePreset]);

  useLayoutEffect(() => {
    const pendingAnchor = pendingToggleAnchorRef.current;

    if (!pendingAnchor) {
      return;
    }

    pendingToggleAnchorRef.current = null;

    const toggleButton = document.querySelector(
      `[data-employee-toggle-id="${pendingAnchor.employeeId}"]`,
    );

    if (!toggleButton) {
      return;
    }

    const newTop = toggleButton.getBoundingClientRect().top;
    window.scrollBy({
      top: newTop - pendingAnchor.top,
      left: 0,
      behavior: "auto",
    });
  });

  const settlement = useMemo(
    () => calculateSettlement({ cashRevenue, amountToSubmit, employees }),
    [cashRevenue, amountToSubmit, employees],
  );
  const duplicateStaffMemberIds = useMemo(
    () => getDuplicateStaffMemberIds(employees),
    [employees],
  );
  const duplicateStaffWarnings = useMemo(
    () => getDuplicateStaffWarnings(employees, staffMembers, duplicateStaffMemberIds),
    [employees, staffMembers, duplicateStaffMemberIds],
  );
  const settlementWarnings = useMemo(
    () => [...settlement.warnings, ...duplicateStaffWarnings],
    [settlement.warnings, duplicateStaffWarnings],
  );
  const hasMissingEmployeeTimes = employees.some(
    (employee) => !employee.startTime || !employee.endTime,
  );

  const updateEmployee = (id, updates) => {
    setEmployees((currentEmployees) =>
      currentEmployees.map((employee) =>
        employee.id === id ? { ...employee, ...updates } : employee,
      ),
    );
  };

  const addStaffMember = (staffMemberInput) => {
    setStaffMembers((currentStaffMembers) =>
      sortStaffMembers([
        ...currentStaffMembers,
        createStaffMember(staffMemberInput),
      ]),
    );
  };

  const deleteStaffMember = (staffMemberId) => {
    setStaffMembers((currentStaffMembers) =>
      currentStaffMembers.filter((staffMember) => staffMember.id !== staffMemberId),
    );
  };

  const updateStaffMember = (staffMemberId, updates) => {
    setStaffMembers((currentStaffMembers) =>
      sortStaffMembers(
        currentStaffMembers.map((staffMember) =>
          staffMember.id === staffMemberId
            ? { ...staffMember, ...updates }
            : staffMember,
        ),
      ),
    );
  };

  const selectStaffMember = (employeeId, staffMemberId) => {
    const selectedStaffMember = staffMembers.find(
      (staffMember) => staffMember.id === staffMemberId,
    );

    if (!selectedStaffMember) {
      updateEmployee(employeeId, { staffMemberId: "" });
      return;
    }

    updateEmployee(employeeId, {
      staffMemberId: selectedStaffMember.id,
      name: selectedStaffMember.name,
      hourlyWage: formatHourlyRateInput(selectedStaffMember.hourlyRate),
      paidInCash: selectedStaffMember.paidCash,
      wagePaidOut: false,
    });
  };

  const addEmployee = () => {
    setEmployees((currentEmployees) => {
      if (currentEmployees.length >= MAX_EMPLOYEES) {
        return currentEmployees;
      }

      return [...currentEmployees, createEmployee(currentEmployees.length + 1)];
    });
  };

  const removeEmployee = (id) => {
    setEmployees((currentEmployees) => {
      if (currentEmployees.length <= MIN_EMPLOYEES) {
        return currentEmployees;
      }

      return currentEmployees.filter((employee) => employee.id !== id);
    });
    setExpandedEmployeeId((currentId) => (currentId === id ? null : currentId));
  };

  const resetSettlement = () => {
    const shouldReset = window.confirm(
      "Möchtest du die aktuelle Abrechnung wirklich löschen?",
    );

    if (!shouldReset) {
      return;
    }

    setCashRevenue("");
    setAmountToSubmit("");
    setEmployees(createInitialEmployees());
    setExpandedEmployeeId(null);
    setActivePreset(null);
  };

  const applyWeekdayPreset = () => {
    setEmployees(createWeekdayEmployees());
    setExpandedEmployeeId(null);
    setActivePreset("weekday");
  };

  const applyWeekendPreset = () => {
    setEmployees(createWeekendEmployees());
    setExpandedEmployeeId(null);
    setActivePreset("weekend");
  };

  const toggleEmployeeCard = (employeeId, toggleTop) => {
    pendingToggleAnchorRef.current = { employeeId, top: toggleTop };
    setExpandedEmployeeId((currentId) =>
      currentId === employeeId ? null : employeeId,
    );
  };

  const openStaffManager = () => {
    const shouldOpen = window.confirm("Mitarbeiterverwaltung öffnen?");

    if (!shouldOpen) {
      return;
    }

    setIsStaffManagerOpen(true);
  };

  const printSettlement = () => {
    const shouldPrint = window.confirm("Abrechnung drucken?");

    if (!shouldPrint) {
      return;
    }

    setEpsonPrintStatus("working");

    try {
      printSettlementReceipt({ settlement, employees });
      window.setTimeout(() => {
        setEpsonPrintStatus("sent");
      }, 1000);
      window.setTimeout(() => {
        setEpsonPrintStatus("idle");
      }, 6000);
    } catch (error) {
      console.error(error);
      setEpsonPrintStatus("failed");
    }
  };

  const epsonPrintButtonLabel =
    hasMissingEmployeeTimes
      ? "Zeiten vollständig eintragen"
      : epsonPrintStatus === "working"
        ? "Druck wird gestartet..."
        : epsonPrintStatus === "sent"
          ? "Abrechnung an Drucker gesendet"
          : epsonPrintStatus === "failed"
            ? "Druck erneut starten"
            : "Abrechnung drucken";

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="header-actions">
          {isStaffManagerOpen ? (
            <button
              className="reset-button"
              aria-expanded={isStaffManagerOpen}
              type="button"
              onClick={() =>
                setIsStaffManagerOpen((currentValue) => !currentValue)
              }
            >
              Zurück zur Abrechnung
            </button>
          ) : (
            <>
              <button
                className="reset-button"
                type="button"
                onClick={resetSettlement}
              >
                Neue Abrechnung
              </button>
              <div className="preset-buttons" aria-label="Abrechnungsvorlage">
                <button
                  aria-pressed={activePreset === "weekday"}
                  type="button"
                  onClick={applyWeekdayPreset}
                >
                  Wochentag
                </button>
                <button
                  aria-pressed={activePreset === "weekend"}
                  type="button"
                  onClick={applyWeekendPreset}
                >
                  Wochenende
                </button>
                <button
                  className="wide-preset-button"
                  aria-expanded={isStaffManagerOpen}
                  type="button"
                  onClick={openStaffManager}
                >
                  Mitarbeiter verwalten
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {isStaffManagerOpen ? (
        <StaffManager
          staffMembers={staffMembers}
          onAddStaffMember={addStaffMember}
          onUpdateStaffMember={updateStaffMember}
          onDeleteStaffMember={deleteStaffMember}
        />
      ) : (
        <>
          <section className="amount-panel" aria-labelledby="cash-heading">
            <label className="field-label" htmlFor="cash-revenue">
              <span id="cash-heading">Bargeld gesamt</span>
              <input
                id="cash-revenue"
                className="amount-input"
                autoComplete="off"
                autoCorrect="off"
                inputMode="decimal"
                pattern="[0-9]*[,.]?[0-9]*"
                placeholder="0,00"
                type="text"
                value={cashRevenue}
                onChange={(event) => setCashRevenue(event.target.value)}
              />
            </label>

            <label className="field-label" htmlFor="amount-to-submit">
              <span>Gesamt Abzugeben</span>
              <input
                id="amount-to-submit"
                className="amount-input"
                autoComplete="off"
                autoCorrect="off"
                inputMode="decimal"
                pattern="[0-9]*[,.]?[0-9]*"
                placeholder="0,00"
                type="text"
                value={amountToSubmit}
                onChange={(event) => setAmountToSubmit(event.target.value)}
              />
            </label>
          </section>

          <section className="section-block" aria-labelledby="employees-heading">
            <div className="section-heading">
              <div>
                <h2 id="employees-heading">Mitarbeiter ({employees.length})</h2>
              </div>
              <button
                className="add-button"
                disabled={employees.length >= MAX_EMPLOYEES}
                type="button"
                onClick={addEmployee}
              >
                + Mitarbeiter
              </button>
            </div>

            <div className="employee-list">
              {employees.map((employee, index) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  index={index}
                  canRemove={employees.length > MIN_EMPLOYEES}
                  isExpanded={expandedEmployeeId === employee.id}
                  result={settlement.employeeResults.find(
                    (item) => item.id === employee.id,
                  )}
                  isDuplicate={duplicateStaffMemberIds.has(employee.staffMemberId)}
                  staffMembers={staffMembers}
                  onChange={updateEmployee}
                  onRemove={removeEmployee}
                  onSelectStaffMember={selectStaffMember}
                  onToggle={toggleEmployeeCard}
                />
              ))}
            </div>
          </section>

          <SettlementSummary settlement={settlement} warnings={settlementWarnings} />

          <section className="finish-panel">
            <button
              className="direct-print-button"
              disabled={epsonPrintStatus === "working" || hasMissingEmployeeTimes}
              type="button"
              onClick={printSettlement}
            >
              {epsonPrintButtonLabel}
            </button>
            {epsonPrintStatus === "failed" ? (
              <p className="print-status-message">
                Drucker nicht erreichbar. Stelle sicher, dass du mit dem WLAN der
                Bar verbunden bist.
              </p>
            ) : null}
            {epsonPrintStatus === "sent" ? (
              <p className="print-status-message">
                Falls nichts gedruckt wird: TM Print Assistant öffnen und Drucker
                auswählen.
              </p>
            ) : null}
          </section>
        </>
      )}
    </main>
  );
}

export default App;

function formatHourlyRateInput(value) {
  return String(value).replace(".", ",");
}

function getDuplicateStaffMemberIds(employees) {
  const counts = new Map();

  employees.forEach((employee) => {
    if (!employee.staffMemberId) {
      return;
    }

    counts.set(employee.staffMemberId, (counts.get(employee.staffMemberId) ?? 0) + 1);
  });

  return new Set(
    [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([staffMemberId]) => staffMemberId),
  );
}

function getDuplicateStaffWarnings(employees, staffMembers, duplicateStaffMemberIds) {
  if (duplicateStaffMemberIds.size === 0) {
    return [];
  }

  const staffLookup = new Map(
    staffMembers.map((staffMember) => [staffMember.id, staffMember.name]),
  );
  const duplicateNames = [...duplicateStaffMemberIds].map(
    (staffMemberId) => staffLookup.get(staffMemberId) || "Ein Mitarbeiter",
  );

  return duplicateNames.map((name) => `${name} ist mehrfach eingetragen.`);
}
