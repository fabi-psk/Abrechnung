import assert from "node:assert/strict";
import { calculateSettlement } from "../src/lib/calculations.js";
import {
  formatSettlementFileDate,
  getSettlementDate,
} from "../src/lib/settlementDate.js";

const employee = {
  id: "1",
  name: "Test",
  startTime: "18:00",
  endTime: "22:00",
  paidInCash: false,
  wagePaidOut: false,
  hourlyWage: "",
};

const cashEmployee = {
  ...employee,
  paidInCash: true,
  hourlyWage: "10",
};

const testCases = [
  {
    name: "normal positive amount",
    input: {
      cashRevenue: "300",
      amountToSubmit: "200",
      walletCash: "",
      employees: [employee],
    },
    expected: {
      totalTips: 100,
      tipsPerHour: 25,
    },
  },
  {
    name: "negative amount with full wallet",
    input: {
      cashRevenue: "100",
      amountToSubmit: "-100",
      walletCash: "100",
      employees: [{ ...employee, endTime: "04:00" }],
    },
    expected: {
      totalTips: 200,
      tipsPerHour: 20,
    },
  },
  {
    name: "negative amount fills wallet first",
    input: {
      cashRevenue: "100",
      amountToSubmit: "-80",
      walletCash: "80",
      employees: [employee],
    },
    expected: {
      totalTips: 160,
      tipsPerHour: 40,
      walletTopUpAmount: 20,
    },
  },
  {
    name: "negative amount without cash revenue fills wallet first",
    input: {
      cashRevenue: "0",
      amountToSubmit: "-80",
      walletCash: "80",
      employees: [employee],
    },
    expected: {
      totalTips: 60,
      tipsPerHour: 15,
      walletTopUpAmount: 20,
    },
  },
  {
    name: "negative amount too small to fill wallet",
    input: {
      cashRevenue: "100",
      amountToSubmit: "-10",
      walletCash: "80",
      employees: [employee],
    },
    expected: {
      totalTips: 0,
      tipsPerHour: 0,
      canFillWallet: false,
    },
  },
  {
    name: "open cash wage is included in payout",
    input: {
      cashRevenue: "300",
      amountToSubmit: "200",
      walletCash: "",
      employees: [cashEmployee],
    },
    expected: {
      totalTips: 100,
      tipsPerHour: 25,
      amountToHandOver: 160,
      remainingCashPayout: 140,
    },
  },
  {
    name: "paid cash wage increases tips",
    input: {
      cashRevenue: "300",
      amountToSubmit: "200",
      walletCash: "",
      employees: [{ ...cashEmployee, wagePaidOut: true }],
    },
    expected: {
      totalTips: 140,
      tipsPerHour: 35,
      amountToHandOver: 160,
      remainingCashPayout: 140,
    },
  },
];

for (const testCase of testCases) {
  const result = calculateSettlement(testCase.input);
  const actual = {
    totalTips: result.totalTips,
    tipsPerHour: result.tipsPerHour,
    walletTopUpAmount: result.walletTopUpAmount,
    canFillWallet: result.canFillWallet,
    amountToHandOver: result.amountToHandOver,
    remainingCashPayout: result.employeeResults[0]?.remainingCashPayout,
  };

  for (const [key, expectedValue] of Object.entries(testCase.expected)) {
    assert.equal(
      actual[key],
      expectedValue,
      `${testCase.name}: expected ${key} to be ${expectedValue}, got ${actual[key]}`,
    );
  }
}

console.log(`${testCases.length} calculation tests passed.`);

const overnightEmployees = [
  {
    ...employee,
    startTime: "18:00",
    endTime: "02:00",
  },
];

assert.equal(
  formatSettlementFileDate(
    getSettlementDate({
      employees: overnightEmployees,
      now: new Date(2026, 9, 2, 3, 0),
    }),
  ),
  "2026-10-01",
  "overnight shifts printed after midnight use the shift start date",
);

assert.equal(
  formatSettlementFileDate(
    getSettlementDate({
      employees: overnightEmployees,
      now: new Date(2026, 9, 1, 23, 0),
    }),
  ),
  "2026-10-01",
  "overnight shifts printed before midnight keep the current date",
);

assert.equal(
  formatSettlementFileDate(
    getSettlementDate({
      employees: [{ ...employee, startTime: "10:00", endTime: "18:00" }],
      now: new Date(2026, 9, 2, 3, 0),
    }),
  ),
  "2026-10-02",
  "same-day shifts keep the print date",
);

console.log("3 settlement date tests passed.");
