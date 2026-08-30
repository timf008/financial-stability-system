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


// Surplus / Deficit after ALL five financial allocations
function margin(netIncome, debt, savings, invest, fixed) {
  return netIncome - (debt + savings + invest + fixed);
}


function clamp(x) {
  return Math.max(0, Math.min(10, x));
}


function cap(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}


// Margin is not a stability factor.
// These are the four base stability factors.
const labels = {
  debt: "Debt Burden",
  savings: "Savings Rate",
  invest: "Investment Rate",
  fixed: "Fixed Costs"
};


// ------------------------------
// SCORING MODEL
// ------------------------------
function scoreDebtBurden(p) {
  const capped = Math.min(p, 40);
  return clamp(10 - (capped / 4));
}


function scoreSavingsRate(p) {
  const capped = Math.min(p, 10);
  return clamp(capped);
}


function scoreInvestmentRate(p) {
  const capped = Math.min(p, 10);
  return clamp(capped);
}


function scoreFixedCosts(p) {
  const capped = Math.min(p, 80);
  return clamp(10 - ((capped - 30) / 5));
}

function marginModifier(pctMargin) {
  if (pctMargin >= 0) return 0;

  return Math.max(-3, pctMargin / 10);
}


// ------------------------------
// CLASSIFICATION
// ------------------------------
function classifyStability(score) {
  if (score >= 8) return "STRONG";
  if (score >= 7) return "STABLE";
  if (score >= 5.5) return "VULNERABLE";
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
function calculateAll(
  grossIncome,
  debt,
  savings,
  pretaxInvest,
  fixed
) {

  // Income input represents monthly take-home income.
  const netIncome = grossIncome;


  // ------------------------------
  // Percentages
  // ------------------------------
  const pctDebt = pct(debt, netIncome);

  const pctSavings = pct(savings, netIncome);

  // Investment rate remains measured against gross income
  const pctInvest = pct(pretaxInvest, grossIncome);

  const pctFixed = pct(fixed, netIncome);


  // ------------------------------
  // SURPLUS / DEFICIT
  // ------------------------------
  // This is an outcome, NOT a scored factor.
  //
  // Income
  // - Debt
  // - Savings
  // - Investments
  // - Fixed Costs
  // = Surplus / Deficit
  //
  const m = margin(
    netIncome,
    debt,
    savings,
    pretaxInvest,
    fixed
  );


  // Margin percentage can be positive or negative.
  const pctMargin = pct(m, netIncome);


  // ------------------------------
  // FOUR FACTOR SCORES
  // ------------------------------
  const scores = {
    debt: scoreDebtBurden(pctDebt),
    savings: scoreSavingsRate(pctSavings),
    invest: scoreInvestmentRate(pctInvest),
    fixed: scoreFixedCosts(pctFixed)
  };


  // ------------------------------
  // FINANCIAL STABILITY SCORE
  // ------------------------------
  //
  // Original weighting:
  // Savings      30%
  // Investments  30%
  // Fixed Costs  20%
  // Debt         20%
  //
  // Total = 100%
  //
  // Normalize those weights to 100%:
  //
  // Savings      30.00%
  // Investments  30.00%
  // Debt         20.00%
  // Fixed Costs  20.00%
  //
  const stabilityWeighted =
    (scores.savings * 0.30) +
    (scores.invest * 0.30) +
    (scores.debt * 0.20) +
    (scores.fixed * 0.20);

  const baseStability = clamp(stabilityWeighted);

  const marginMod = marginModifier(pctMargin);

  const overall = clamp(baseStability + marginMod);


  // ------------------------------
  // FINANCIAL STRESS SCORE
  // ------------------------------
  //
  // Stress is based on the two direct
  // financial pressure factors:
  //
  // Debt Burden  40%
  // Fixed Costs  60%
  //
  // Margin does NOT affect stress.
  // Negative margin affects stability separately.

  const stressWeighted =
    (scores.debt * 0.40) +
    (scores.fixed * 0.60);

  const stressScore = clamp(10 - stressWeighted);


  // ------------------------------
  // RETURN RESULTS
  // ------------------------------
  return {

    pct: {
      pctDebt,
      pctSavings,
      pctInvest,
      pctFixed,
      pctMargin
    },

    scores,

    baseStability,
    marginModifier: marginMod,
    overall,

    stressScore,

    // Actual dollar surplus / deficit
    marginValue: m
  };
}


// ------------------------------
// WHAT-IF ENGINE
// ------------------------------
function whatIf(income, debt, savings, invest, fixed) {

  return {

    debtMinus300:
      calculateAll(
        income,
        debt - 300,
        savings,
        invest,
        fixed
      ).overall,


    savingsPlus100:
      calculateAll(
        income,
        debt,
        savings + 100,
        invest,
        fixed
      ).overall,


    fixedMinus200:
      calculateAll(
        income,
        debt,
        savings,
        invest,
        fixed - 200
      ).overall

  };
}

// ------------------------------
// FACTOR WEIGHTS
// ------------------------------
const stabilityWeights = {
  savings: 0.30,
  invest: 0.30,
  debt: 0.30,
  fixed: 0.10
};


// ------------------------------
// FACTOR DIRECTIONS
// ------------------------------
const factorDirections = {
  savings: "increase",
  invest: "increase",
  debt: "decrease",
  fixed: "decrease"
};


// ------------------------------
// FACTOR PERFORMANCE
// ------------------------------
function classifyFactor(score) {

  if (score >= 8) return "strong";
  if (score >= 6) return "solid";
  if (score >= 4) return "moderate";

  return "an area of concern";
}


// ------------------------------
// PERSONAL FINANCIAL REPORT
// ------------------------------
function buildReport(result, sorted) {

  // Stability focuses only on controllable financial levers:
  // Savings, Investments, and Debt.
  const stabilityKeys = [
    "savings",
    "invest",
    "debt"
  ];

  const stabilitySorted =
    stabilityKeys
      .sort((a, b) =>
        result.scores[b] - result.scores[a]
      );

  const strongestKey = stabilitySorted[0];
  const weakestKey = stabilitySorted[stabilitySorted.length - 1];

  const strongestLabel = labels[strongestKey];
  const weakestLabel = labels[weakestKey];

  const strongestPerformance =
    classifyFactor(result.scores[strongestKey]);

  const overallClass =
    classifyStability(result.overall)
      .toLowerCase()
      .replace("_", " ");


  let narrative =
    `Your overall financial position is ${overallClass}, `;


  // If all three core factors are strong, don't manufacture
  // a "weakest" factor.
  const allFactorsStrong =
    stabilityKeys.every(key =>
      result.scores[key] >= 8
    );


  if (allFactorsStrong) {

    narrative +=
      `with strong performance across savings, investments, and debt. `;

    narrative +=
      `You currently have no significant weakness among your core financial stability factors.`;

    return narrative;
  }


  // Normal Stability Report
  narrative +=
    `with ${strongestPerformance} performance in ${strongestLabel.toLowerCase()}. `;

  narrative +=
    `Your biggest opportunity is ${weakestLabel.toLowerCase()}, `;

  narrative +=
    `which is currently your weakest financial factor. `;


  // Calculate the maximum possible contribution
  // this factor could make to the overall Stability score.
  const factorGap =
    10 - result.scores[weakestKey];

  const stabilityImpact =
    (factorGap * stabilityWeights[weakestKey]).toFixed(1);


  if (Number(stabilityImpact) > 0) {

    narrative +=
      `Improving your ${weakestLabel.toLowerCase()} factor `;

    narrative +=
      `could increase your Financial Stability score by up to approximately `;

    narrative +=
      `${stabilityImpact} points.`;
  }


  return narrative;
}


// ------------------------------
// FINANCIAL STRESS REPORT
// ------------------------------
function buildStressReport(result, sorted) {

  // Stress considers all four factors because Fixed Costs
  // represent financial pressure and flexibility.
  const stressKeys = [
    "savings",
    "invest",
    "debt",
    "fixed"
  ];

  const stressSorted =
    stressKeys
      .sort((a, b) =>
        result.scores[a] - result.scores[b]
      );

  const weakestKey = stressSorted[0];
  const weakestLabel = labels[weakestKey];

  const stressWord =
    classifyStress(result.stressScore).toLowerCase();


  let narrative;


  // --------------------------------
  // LOW STRESS
  // --------------------------------
  if (result.stressScore <= 3) {

    narrative =
      `Your financial habits are helping keep financial stress low. `;

    narrative +=
      `Your current stress level is ${stressWord}, indicating that your finances have a relatively comfortable level of flexibility. `;

    if (weakestKey === "fixed") {

      narrative +=
        `Your fixed costs are your largest source of financial pressure, but they are not currently creating significant stress.`;

    } else {

      const direction =
        factorDirections[weakestKey];

      if (direction === "increase") {

        narrative +=
          `Your ${weakestLabel.toLowerCase()} performance has the most room for improvement, but your overall financial pressure remains low.`;

      } else {

        narrative +=
          `Your ${weakestLabel.toLowerCase()} is your largest source of financial pressure, but your overall financial stress remains low.`;
      }
    }

    return narrative;
  }


  // --------------------------------
  // MODERATE STRESS
  // --------------------------------
  if (result.stressScore <= 6) {

    if (weakestKey === "fixed") {

      narrative =
        `Your savings performance is helping reduce financial stress, `;

      narrative +=
        `but your fixed costs consume a relatively large share of your income. `;

      narrative +=
        `Your current stress level is ${stressWord}, indicating that your finances are manageable but could benefit from additional flexibility. `;

      narrative +=
        `Reducing fixed costs would increase your financial flexibility.`;

    } else {

      const direction =
        factorDirections[weakestKey];

      narrative =
        `Your savings and investment performance are helping reduce financial stress, `;

      if (direction === "increase") {

        narrative +=
          `but your ${weakestLabel.toLowerCase()} performance has room for improvement. `;

      } else {

        narrative +=
          `but your ${weakestLabel.toLowerCase()} is placing additional pressure on your finances. `;
      }

      narrative +=
        `Your current stress level is ${stressWord}, indicating that your finances are manageable but could benefit from additional flexibility. `;

      if (direction === "increase") {

        narrative +=
          `Increasing your ${weakestLabel.toLowerCase()} would improve your financial flexibility.`;

      } else {

        narrative +=
          `Reducing your ${weakestLabel.toLowerCase()} would improve your financial flexibility.`;
      }
    }

    return narrative;
  }


  // --------------------------------
  // HIGH STRESS
  // --------------------------------
  if (weakestKey === "fixed") {

    narrative =
      `Your fixed costs consume a relatively large share of your income, `;

    narrative +=
      `which is contributing to your current financial stress. `;

    narrative +=
      `Your current stress level is ${stressWord}, indicating that your monthly cash flow is under meaningful pressure. `;

    narrative +=
      `Reducing fixed costs would create additional financial flexibility.`;

  } else {

    const direction =
      factorDirections[weakestKey];

    narrative =
      `Your current stress level is ${stressWord}, indicating that your finances are under meaningful pressure. `;

    if (direction === "increase") {

      narrative +=
        `Improving your ${weakestLabel.toLowerCase()} performance could help increase your financial flexibility.`;

    } else {

      narrative +=
        `Reducing your ${weakestLabel.toLowerCase()} would help increase your financial flexibility.`;
    }
  }


  return narrative;
}


// ------------------------------
// UPDATE UI
// ------------------------------
function updateUI() {

  const grossIncome = Number(incomeEl.value);

  const debt = Number(debtEl.value);

  const savings = Number(savingsEl.value);

  const pretaxInvest = Number(investEl.value);

  const fixed = Number(fixedEl.value);


  const result = calculateAll(
    grossIncome,
    debt,
    savings,
    pretaxInvest,
    fixed
  );


  // ------------------------------
  // FACTOR BREAKDOWN
  // ------------------------------
  document.querySelector("#debtPct").textContent =
    result.pct.pctDebt.toFixed(1) + "%";

  document.querySelector("#debtScore").textContent =
    result.scores.debt.toFixed(1);


  document.querySelector("#savingsPct").textContent =
    result.pct.pctSavings.toFixed(1) + "%";

  document.querySelector("#savingsScore").textContent =
    result.scores.savings.toFixed(1);


  document.querySelector("#investPct").textContent =
    result.pct.pctInvest.toFixed(1) + "%";

  document.querySelector("#investScore").textContent =
    result.scores.invest.toFixed(1);


  document.querySelector("#fixedPct").textContent =
    result.pct.pctFixed.toFixed(1) + "%";

  document.querySelector("#fixedScore").textContent =
    result.scores.fixed.toFixed(1);


  // ------------------------------
  // SURPLUS / DEFICIT
  // ------------------------------
  const marginAmount =
    result.marginValue >= 0
      ? `+$${result.marginValue.toFixed(0)}`
      : `-$${Math.abs(result.marginValue).toFixed(0)}`;


  const marginPercentage =
    result.pct.pctMargin >= 0
      ? `+${result.pct.pctMargin.toFixed(1)}%`
      : `${result.pct.pctMargin.toFixed(1)}%`;


  document.querySelector("#marginAmount").textContent =
    marginAmount;

  document.querySelector("#marginPct").textContent =
    marginPercentage;


  // ------------------------------
  // MAIN STABILITY SCORE
  // ------------------------------
  document.querySelector("#overallScore").textContent =
    result.overall.toFixed(1) + " / 10";


  document.querySelector("#stabilityStatus").textContent =
    classifyStability(result.overall);


  // ------------------------------
  // FINANCIAL STRESS
  // ------------------------------
  document.querySelector("#stressScore").textContent =
    result.stressScore.toFixed(1) + " / 10";


  document.querySelector("#stressStatus").textContent =
    classifyStress(result.stressScore);


  // ------------------------------
  // WHAT-IF
  // ------------------------------
  document.querySelector("#wiCurrentScore").textContent =
    result.overall.toFixed(1);


  const wi = whatIf(
    grossIncome,
    debt,
    savings,
    pretaxInvest,
    fixed
  );


  document.querySelector("#wiDebt").textContent =
    wi.debtMinus300.toFixed(1);


  document.querySelector("#wiSavings").textContent =
    wi.savingsPlus100.toFixed(1);


  document.querySelector("#wiFixed").textContent =
    wi.fixedMinus200.toFixed(1);


  // ------------------------------
  // PROFILE
  // ------------------------------
  const sorted =
    Object.entries(result.scores)
      .sort((a, b) => b[1] - a[1]);


  document.querySelector("#strongest").textContent =
    labels[sorted[0][0]];


  document.querySelector("#opportunity").textContent =
    labels[sorted[sorted.length - 1][0]];


  // ------------------------------
  // PERSONAL FINANCIAL REPORT
  // ------------------------------
  const report =
    buildReport(result, sorted);


  document.querySelector("#report").textContent =
    report;


  // ------------------------------
  // FINANCIAL STRESS REPORT
  // ------------------------------
  const stressReport =
    buildStressReport(result, sorted);


  document.querySelector("#stressReport").textContent =
    stressReport;


  // ------------------------------
  // 12-MONTH CALCULATIONS
  // ------------------------------
  const monthlyInvest = pretaxInvest;

  const investGrowthRate = 0.12;

  const investTotal =
    (monthlyInvest * 12) *
    (1 + investGrowthRate);


  const monthlySavings = savings;

  const savingsTotal =
    monthlySavings * 12;


  // Actual monthly Surplus / Deficit
  const monthlyMargin =
    result.marginValue;

  const marginTotal =
    monthlyMargin * 12;


  // ------------------------------
  // UPDATE 12-MONTH UI
  // ------------------------------
  document.querySelector("#tmInvestMonthly").textContent =
    `$${monthlyInvest.toFixed(2)}`;


  document.querySelector("#tmInvestTotal").textContent =
    `$${investTotal.toFixed(2)}`;


  document.querySelector("#tmSaveMonthly").textContent =
    `$${monthlySavings.toFixed(2)}`;


  document.querySelector("#tmSaveTotal").textContent =
    `$${savingsTotal.toFixed(2)}`;


  document.querySelector("#tmMarginMonthly").textContent =
    `$${monthlyMargin.toFixed(2)}`;

  document.querySelector("#tmMarginTotal").textContent =
    `$${marginTotal.toFixed(2)}`;
}


// ------------------------------
// EVENT LISTENERS
// ------------------------------
[incomeEl, debtEl, savingsEl, investEl, fixedEl].forEach(el =>
  el.addEventListener("input", updateUI)
);
