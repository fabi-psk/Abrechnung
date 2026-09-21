import { useState } from "react";
import { formatCurrency, formatHours } from "../lib/formatters";

export function SettlementSummary({ settlement }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="summary-panel" aria-labelledby="summary-heading">
      <div className="summary-header">
        <div>
          <p className="section-kicker">Ergebnis</p>
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

      <dl className="summary-quick">
        <SummaryItem
          label="Trinkgeld gesamt"
          value={formatCurrency(settlement.totalTips)}
        />
        <SummaryItem
          label="Trinkgeld pro Stunde"
          value={formatCurrency(settlement.tipsPerHour)}
        />
      </dl>

      {isExpanded ? (
        <div className="summary-details">
          <dl className="summary-grid">
            <SummaryItem
              label="Umsatz"
              value={formatCurrency(settlement.cashRevenue)}
            />
            <SummaryItem
              label="Brutto abzugeben"
              value={formatCurrency(settlement.amountToSubmit)}
            />
            <SummaryItem
              label="Bar ausgezahlte Löhne"
              value={formatCurrency(settlement.cashWagesTotal)}
            />
            <SummaryItem
              label="Netto abzugeben"
              value={formatCurrency(Math.max(settlement.amountToHandOver, 0))}
            />
            <SummaryItem
              label="Gesamtstunden"
              value={formatHours(settlement.totalHours)}
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
                        Stundenlohn {formatCurrency(employeeResult.hourlyWage)}
                      </span>
                      <span>
                        Barlohn {formatCurrency(employeeResult.cashWage)}
                      </span>
                      <strong className="tip-value">
                        Trinkgeld {formatCurrency(employeeResult.tip)}
                      </strong>
                      <strong>
                        Gesamtauszahlung{" "}
                        {formatCurrency(employeeResult.totalCashPayout)}
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

function SummaryItem({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
