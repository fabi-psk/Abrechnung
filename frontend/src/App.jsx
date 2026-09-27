import { useEffect, useMemo, useState } from "react";
import { EmployeeCard } from "./components/EmployeeCard";
import { SettlementSummary } from "./components/SettlementSummary";
import { StaffManager } from "./components/StaffManager";
import { calculateSettlement } from "./lib/calculations";
import { createSettlementPdf, shareOrDownloadPdf } from "./lib/pdfSettlement";
import {
  createStaffMember,
  loadStaffMembers,
  saveStaffMembers,
  sortStaffMembers,
} from "./lib/staffStorage";
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
  hourlyWage: "",
});

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
  const [cashRevenue, setCashRevenue] = useState("");
  const [amountToSubmit, setAmountToSubmit] = useState("");
  const [employees, setEmployees] = useState(createInitialEmployees);
  const [staffMembers, setStaffMembers] = useState(loadStaffMembers);
  const [isStaffManagerOpen, setIsStaffManagerOpen] = useState(false);
  const [activePreset, setActivePreset] = useState(null);
  const [finishStatus, setFinishStatus] = useState("idle");

  useEffect(() => {
    saveStaffMembers(staffMembers);
  }, [staffMembers]);

  const settlement = useMemo(
    () => calculateSettlement({ cashRevenue, amountToSubmit, employees }),
    [cashRevenue, amountToSubmit, employees],
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
    setActivePreset(null);
  };

  const applyWeekdayPreset = () => {
    setEmployees(createWeekdayEmployees());
    setActivePreset("weekday");
  };

  const applyWeekendPreset = () => {
    setEmployees(createWeekendEmployees());
    setActivePreset("weekend");
  };

  const finishSettlement = async () => {
    setFinishStatus("working");

    try {
      const pdf = createSettlementPdf({ settlement, employees });
      const result = await shareOrDownloadPdf(pdf);
      setFinishStatus(result);
    } catch (error) {
      console.error(error);
      setFinishStatus("failed");
    }
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="header-actions">
          <button className="reset-button" type="button" onClick={resetSettlement}>
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
              onClick={() =>
                setIsStaffManagerOpen((currentValue) => !currentValue)
              }
            >
              Mitarbeiter verwalten
            </button>
          </div>
        </div>
      </header>

      {isStaffManagerOpen ? (
        <StaffManager
          staffMembers={staffMembers}
          onAddStaffMember={addStaffMember}
          onUpdateStaffMember={updateStaffMember}
          onDeleteStaffMember={deleteStaffMember}
        />
      ) : null}

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
            <p className="section-kicker">Team</p>
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
              result={settlement.employeeResults.find(
                (item) => item.id === employee.id,
              )}
              staffMembers={staffMembers}
              onChange={updateEmployee}
              onRemove={removeEmployee}
              onSelectStaffMember={selectStaffMember}
            />
          ))}
        </div>
      </section>

      <SettlementSummary settlement={settlement} />

      <section className="finish-panel">
        <button
          className="finish-button"
          disabled={finishStatus === "working"}
          type="button"
          onClick={finishSettlement}
        >
          Abrechnung fertigstellen
        </button>
      </section>
    </main>
  );
}

export default App;

function formatHourlyRateInput(value) {
  return String(value).replace(".", ",");
}
