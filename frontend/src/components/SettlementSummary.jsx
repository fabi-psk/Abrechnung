import { useState } from "react";
import { formatCurrency, formatHours } from "../lib/formatters";

export function SettlementSummary({ settlement }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="summary-panel" aria-labelledby="summary-heading">
      <div className="summary-header">
        <div>
          <h2 id="summary-heading">Abrechnung</h2>
        </div>
        <button
          className="icon-toggle"
          type="button"
          aria-expanded={isExpanded}
          aria-label={
            isExpanded
              ? "Abrechnungsdetails ausblenden"
              : "Abrechnungsdetails anzeigen"
          }
          onClick={() => setIsExpanded((currentValue) => !currentValue)}
        >
          <span className="chevron" aria-hidden="true" />
        </button>
      </div>

      {settlement.warnings.length > 0 ? (
        <div className="warning-list" role="alert">
          {settlement.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      {isExpanded ? (
        <div className="summary-details">
          <dl className="summary-grid">
            <SummaryItem
              label="Bargeld gesamt"
              value={formatCurrency(settlement.cashRevenue)}
              variant="info"
            />
            <SummaryItem
              label="Bereits ausgezahlter Lohn"
              value={`+ ${formatCurrency(settlement.paidOutCashWagesTotal)}`}
              variant="positive"
            />
            <SummaryItem
              label="Bargeld gesamt mit ausgezahltem Lohn"
              value={formatCurrency(settlement.cashRevenueWithPaidOutWages)}
              variant="info"
            />
            <SummaryItem
              label="Gesamt Abzugeben"
              value={formatCurrency(settlement.amountToSubmit)}
              variant="info"
            />
            <SummaryItem
              label="Noch auszuzahlende Barlöhne"
              value={`- ${formatCurrency(settlement.openCashWagesTotal)}`}
              variant="danger"
            />
            <SummaryItem
              label="Abzugeben nach Lohn"
              value={formatCurrency(settlement.amountToHandOver)}
              variant="success"
            />
            <SummaryItem
              label="Trinkgeld gesamt"
              value={formatCurrency(settlement.totalTips)}
              variant="muted"
            />
            <SummaryItem
              label="Trinkgeld pro Stunde"
              value={formatCurrency(settlement.tipsPerHour)}
              variant="muted"
            />
            <SummaryItem
              label="Gesamtstunden"
              value={formatHours(settlement.totalHours)}
              variant="muted"
            />
          </dl>

          <div className="payout-list">
            {settlement.employeeResults.map((employeeResult) => (
              <article className="payout-row" key={employeeResult.id}>
                <div>
                  <h3>{employeeResult.name}</h3>
                  <p>{formatHours(employeeResult.hours)}</p>
                </div>
                <div className="payout-values">
                  {employeeResult.paidInCash ? (
                    <>
                      <span>
                        Barlohn {formatCurrency(employeeResult.cashWage)}
                      </span>
                      {employeeResult.wagePaidOut ? (
                        <span>
                          Bereits ausgezahlt{" "}
                          {formatCurrency(employeeResult.cashWage)}
                        </span>
                      ) : null}
                      <strong className="tip-value">
                        Trinkgeld {formatCurrency(employeeResult.tip)}
                      </strong>
                      <strong>
                        Noch auszuzahlen{" "}
                        {formatCurrency(employeeResult.remainingCashPayout)}
                      </strong>
                    </>
                  ) : (
                    <strong className="tip-value">
                      Trinkgeld {formatCurrency(employeeResult.tip)}
                    </strong>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SummaryItem({ label, value, variant }) {
  const className =
    variant === "success"
      ? "summary-item-success"
      : variant === "info"
        ? "summary-item-info"
        : variant === "muted"
          ? "summary-item-muted"
          : variant === "positive"
            ? "summary-item-positive"
            : variant === "danger"
              ? "summary-item-danger"
              : undefined;

  return (
    <div className={className}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
