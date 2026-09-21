import { useEffect, useMemo, useState } from "react";
import { EmployeeCard } from "./components/EmployeeCard";
import { SettlementSummary } from "./components/SettlementSummary";
import { calculateSettlement } from "./lib/calculations";
import "./styles.css";

const MIN_EMPLOYEES = 2;
const MAX_EMPLOYEES = 6;
let nextEmployeeId = 1;

const createEmployee = (index) => ({
  id: `employee-${nextEmployeeId++}`,
  name: `Mitarbeiter ${index}`,
  startTime: "",
  endTime: "",
  paidInCash: false,
  hourlyWage: "",
});

const createInitialEmployees = () => [createEmployee(1), createEmployee(2)];

function App() {
  const [cashRevenue, setCashRevenue] = useState("");
  const [amountToSubmit, setAmountToSubmit] = useState("");
  const [employees, setEmployees] = useState(createInitialEmployees);
  const [showResetFeedback, setShowResetFeedback] = useState(false);

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
    setCashRevenue("");
    setAmountToSubmit("");
    setEmployees(createInitialEmployees());
    setShowResetFeedback(true);
  };

  useEffect(() => {
    if (!showResetFeedback) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShowResetFeedback(false);
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, [showResetFeedback]);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Schicht- und Kassenabrechnung</p>
          <h1>Abrechnung</h1>
        </div>
        <button className="reset-button" type="button" onClick={resetSettlement}>
          Neue Abrechnung
        </button>
      </header>

      {showResetFeedback ? (
        <div className="reset-feedback" role="status">
          Neue Abrechnung gestartet
        </div>
      ) : null}

      <section className="amount-panel" aria-labelledby="cash-heading">
        <label className="field-label" htmlFor="cash-revenue">
          <span id="cash-heading">Umsatz</span>
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
          <span>Brutto abzugeben</span>
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
              onChange={updateEmployee}
              onRemove={removeEmployee}
            />
          ))}
        </div>
      </section>

      <SettlementSummary settlement={settlement} />
    </main>
  );
}

export default App;
