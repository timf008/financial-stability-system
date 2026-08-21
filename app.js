// ------------------------------
// INPUT ELEMENTS
// ------------------------------
const incomeEl = document.querySelector("#income");
const debtEl = document.querySelector("#debt");
const savingsEl = document.querySelector("#savings");
const investEl = document.querySelector("#investments");
const fixedEl = document.querySelector("#fixed");

// ------------------------------
// HELPER FUNCTIONS
// ------------------------------
function pct(value, income) {
  return income > 0 ? (value / income) * 100 : 0;
}

function margin(income, debt, savings, invest, fixed) {
  return income - (debt + savings + invest + fixed);
}

// ------------------------------
// SCORING MODEL (adjust anytime)
// ------------------------------
function scoreDebtBurden(p) {
  return 10 - (p / 10);
}

function scoreSavingsRate(p) {
  return p / 2;
}

function scoreInvestmentRate(p) {
  return p / 1.8;
}

function scoreFixedCosts(p) {
  return 10 - (p / 6);
}

function scoreMargin(p) {
  return p / 2;
}

// ------------------------------
// CLASSIFICATION
// ------------------------------
function classifyStability(score) {
  if (score >= 8) return "STRONG";
  if (score >= 7) return "STABLE";
  if (score >= 5.5) return "WEAK";
  return "UNSTABLE";
}

function classifyStress(score) {
  if (score < 4) return "LOW";
  if (score < 6) return "MODERATE";
  if (score < 8) return "ELEVATED";
  return "HIGH";
}

// ------------------------------
// MAIN CALCULATION ENGINE
// ------------------------------
function calculateAll(income, debt, savings, invest, fixed) {
  const m = margin(income, debt, savings, invest, fixed);

  const pctDebt = pct(debt, income);
  const pctSavings = pct(savings, income);
  const pctInvest = pct(invest, income);
  const pctFixed = pct(fixed, income);
  const pctMargin = pct(m, income);

  const scores = {
    debt: scoreDebtBurden(pctDebt),
    savings: scoreSavingsRate(pctSavings),
    invest: scoreInvestmentRate(pctInvest),
    fixed: scoreFixedCosts(pctFixed),
    margin: scoreMargin(pctMargin)
  };

  const overall =
    (scores.debt +
      scores.savings +
      scores.invest +
      scores.fixed +
      scores.margin) /
    5;

  const stressScore = 10 - overall;

  return {
    pct: { pctDebt, pctSavings, pctInvest, pctFixed, pctMargin },
    scores,
    overall,
    stressScore,
    marginValue: m
  };
}

// ------------------------------
// WHAT-IF ENGINE
// ------------------------------
function whatIf(income, debt, savings, invest, fixed) {
  return {
    debtMinus300: calculateAll(income, debt - 300, savings, invest, fixed).overall,
    savingsPlus100: calculateAll(income, debt, savings + 100, invest, fixed).overall,
    fixedMinus200: calculateAll(income, debt, savings, invest, fixed - 200).overall
  };
}

// ------------------------------
// UPDATE UI
// ------------------------------
function updateUI() {
  const income = Number(incomeEl.value);
  const debt = Number(debtEl.value);
  const savings = Number(savingsEl.value);
  const invest = Number(investEl.value);
  const fixed = Number(fixedEl.value);

  const result = calculateAll(income, debt, savings, invest, fixed);

  // Factor Breakdown
  document.querySelector("#debtPct").textContent = result.pct.pctDebt.toFixed(1) + "%";
  document.querySelector("#debtScore").textContent = result.scores.debt.toFixed(1);

  document.querySelector("#savingsPct").textContent = result.pct.pctSavings.toFixed(1) + "%";
  document.querySelector("#savingsScore").textContent = result.scores.savings.toFixed(1);

  document.querySelector("#investPct").textContent = result.pct.pctInvest.toFixed(1) + "%";
  document.querySelector("#investScore").textContent = result.scores.invest.toFixed(1);

  document.querySelector("#fixedPct").textContent = result.pct.pctFixed.toFixed(1) + "%";
  document.querySelector("#fixedScore").textContent = result.scores.fixed.toFixed(1);

  document.querySelector("#marginPct").textContent = result.pct.pctMargin.toFixed(1) + "%";
  document.querySelector("#marginScore").textContent = result.scores.margin.toFixed(1);

  // Main Score
  document.querySelector("#overallScore").textContent =
    result.overall.toFixed(1) + " / 10";
  document.querySelector("#stabilityStatus").textContent =
    classifyStability(result.overall);

  // Stress
  document.querySelector("#stressScore").textContent =
    result.stressScore.toFixed(1) + " / 10";
  document.querySelector("#stressStatus").textContent =
    classifyStress(result.stressScore);

  // What-If
  const wi = whatIf(income, debt, savings, invest, fixed);
  document.querySelector("#wiDebt").textContent = wi.debtMinus300.toFixed(1);
  document.querySelector("#wiSavings").textContent = wi.savingsPlus100.toFixed(1);
  document.querySelector("#wiFixed").textContent = wi.fixedMinus200.toFixed(1);

  // Profile
  const sorted = Object.entries(result.scores).sort((a, b) => b[1] - a[1]);
  document.querySelector("#strongest").textContent = sorted[0][0];
  document.querySelector("#opportunity").textContent = sorted[sorted.length - 1][0];
}

// ------------------------------
// EVENT LISTENERS
// ------------------------------
[incomeEl, debtEl, savingsEl, investEl, fixedEl].forEach(el =>
  el.addEventListener("input", updateUI)
);
