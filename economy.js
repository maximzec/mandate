/* Deterministic tick-based economy model for Mandate. All money is in billions of local currency. */
(() => {
  const TAX_META = {
    vat_main: { label: 'НДС, основная ставка', refBase: 0.45, elasticity: 1.1, compliance: 0.92 },
    pit: { label: 'НДФЛ', refBase: 0.30, elasticity: 0.7, compliance: 0.90 },
    payroll: { label: 'Взносы с фонда оплаты труда', refBase: 0.30, elasticity: 1.0, compliance: 0.91 },
    corporate: { label: 'Налог на прибыль', refBase: 0.12, elasticity: 1.8, compliance: 0.84 },
    resource: { label: 'Ресурсные доходы', refBase: 0.10, elasticity: 0.6, compliance: 0.86 }
  };
  const TAX_KEYS = Object.keys(TAX_META);
  const SPEND_KEYS = ['healthcare', 'education', 'infrastructure', 'social', 'administration', 'defense'];
  const SPEND_LABELS = {
    healthcare: 'Здравоохранение', education: 'Образование', infrastructure: 'Инфраструктура',
    social: 'Социальные выплаты', administration: 'Администрация и безопасность', defense: 'Оборона'
  };
  const COMPONENTS = [
    { key: 'core', weight: 0.68, rateSensitivity: 1.0 },
    { key: 'food', weight: 0.17, rateSensitivity: 0.48 },
    { key: 'energy', weight: 0.10, rateSensitivity: 0.18 },
    { key: 'imported', weight: 0.05, rateSensitivity: 0.82 }
  ];
  const RATE_WEIGHTS = Array.from({ length: 22 }, (_, i) => (i + 1) ** 2 * Math.exp(-(i + 1) / 4));
  const RATE_WEIGHT_SUM = RATE_WEIGHTS.reduce((sum, value) => sum + value, 0);
  const RATE_WEIGHTED = RATE_WEIGHTS.map((value) => value / RATE_WEIGHT_SUM);
  const OUTPUT_WEIGHTS_RAW = Array.from({ length: 11 }, (_, i) => (i + 1) * Math.exp(-(i + 1) / 4));
  const OUTPUT_WEIGHT_SUM = OUTPUT_WEIGHTS_RAW.reduce((sum, value) => sum + value, 0);
  const OUTPUT_WEIGHTS = OUTPUT_WEIGHTS_RAW.map((value) => value / OUTPUT_WEIGHT_SUM);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const sum = (items) => items.reduce((total, value) => total + value, 0);
  const copy = (value) => JSON.parse(JSON.stringify(value));

  function initialPolicy(country) {
    const taxes = { ...country.taxRates };
    const baseSpend = { healthcare: 3.2, education: 3.4, infrastructure: 2.6, social: 7.4, administration: 2.8, defense: 3.2 };
    const initialRates = effectiveTaxRates(taxes);
    const estimatedTax = TAX_KEYS.reduce((total, key) => {
      const rate = initialRates[key];
      const base = key === 'vat_main' ? taxes.vat_taxable_share : TAX_META[key].refBase;
      return total + rate / 100 * base * TAX_META[key].compliance;
    }, 0);
    const interestRatio = (country.debt_to_gdp_pct / 100) * country.average_coupon_pct / 12;
    const targetMonthlyBalance = country.budget / 1200;
    const spendBase = sum(Object.values(baseSpend));
    const targetSpend = Math.max(12, estimatedTax + country.other_revenue_pct - interestRatio - targetMonthlyBalance);
    const multiplier = targetSpend / spendBase;
    Object.keys(baseSpend).forEach((key) => { baseSpend[key] = Math.round(baseSpend[key] * multiplier * 10) / 10; });
    return {
      taxes,
      admin_quality: 0.72,
      borrowing_share_pct: 100,
      policy_rate_pct: country.rate,
      payroll_employer_share_pct: 70,
      spend_plan_pct_gdp: baseSpend
    };
  }

  function effectiveTaxRates(taxes) {
    const reducedShare = taxes.vat_reduced_share_pct / 100;
    const exemptShare = taxes.vat_exempt_share_pct / 100;
    const standardShare = Math.max(0, 1 - reducedShare - exemptShare);
    return {
      vat_main: taxes.vat_main_pct * standardShare + taxes.vat_reduced_pct * reducedShare,
      pit: taxes.pit_pct,
      payroll: taxes.payroll_pct,
      corporate: taxes.corporate_pct,
      resource: taxes.resource_pct
    };
  }

  function createEconomyState(country) {
    const policy = initialPolicy(country);
    const annualInflationFactor = 1 + country.inflation / 100;
    const cpiHistory = Array.from({ length: 13 }, (_, i) => 100 * Math.pow(annualInflationFactor, (i - 12) / 12));
    const initialNominal = country.monthly_gdp_lcu;
    const debt = initialNominal * 12 * country.debt_to_gdp_pct / 100;
    const initialSpend = sum(Object.values(policy.spend_plan_pct_gdp));
    const state = {
      schema_version: '0.2',
      seed: country.event_seed || 2026,
      month_number: 0,
      month_progress: 0,
      month_flows: { gdp: 0, taxes: 0, balance: 0 },
      real_gdp: 100,
      potential_gdp: 100,
      nominal_gdp_lcu: initialNominal,
      gdp_deflator_index: 100,
      gdp_deflator_log_history: [],
      cpi_index: 100,
      cpi_history: cpiHistory,
      cpi_month_start: 100,
      cpi_components: { core: 100, food: 100, energy: 100, imported: 100 },
      inflation_mom_pct: (Math.pow(annualInflationFactor, 1 / 12) - 1) * 100,
      inflation_yoy_pct: country.inflation,
      core_inflation_yoy_pct: country.inflation * 0.82,
      inflation_expectation_pct: country.inflation,
      output_gap_pct: 0,
      policy_rate_pct: country.rate,
      loan_rate_pct: country.rate + country.loan_spread_pct,
      deposit_rate_pct: Math.max(0, country.rate - country.deposit_spread_pct),
      employment: country.population_millions * (1 - country.unemployment / 100),
      unemployment_pct: country.unemployment,
      real_wage_index: 100,
      private_investment_index: 100,
      revenue_lcu: 0,
      tax_revenue_lcu: 0,
      primary_spending_lcu: initialNominal * initialSpend / 100,
      interest_lcu: initialNominal * country.debt_to_gdp_pct / 100 * country.average_coupon_pct / 1200,
      primary_balance_lcu: 0,
      overall_balance_lcu: 0,
      net_borrowing_lcu: 0,
      debt_lcu: debt,
      cash_lcu: initialNominal * 12 * 0.04,
      debt_cohorts: [{ balance_lcu: debt * 0.55, coupon_pct: country.average_coupon_pct, months_to_maturity: 60 }, { balance_lcu: debt * 0.45, coupon_pct: country.average_coupon_pct, months_to_maturity: 120 }],
      policy,
      collection_quality: policy.admin_quality,
      queued_decision: null,
      rate_impulses: [],
      vat_impulses: [],
      tax_receipts_history: [],
      nominal_gdp_history: [],
      balance_history: [],
      primary_spending_ratio_pct: initialSpend,
      baseline_spending_ratio_pct: initialSpend,
      baseline_tax_burden_pct: 0,
      investment_history: Array(24).fill(policy.spend_plan_pct_gdp.infrastructure + policy.spend_plan_pct_gdp.education),
      baseline_investment_pct: policy.spend_plan_pct_gdp.infrastructure + policy.spend_plan_pct_gdp.education,
      core_cpi_index: 100,
      core_cpi_history: Array.from({ length: 13 }, (_, i) => 100 * Math.pow(1 + country.inflation * 0.82 / 100, (i - 12) / 12)),
      core_cpi_month_start: 100,
      other_revenue_lcu: initialNominal * country.other_revenue_pct / 100,
      tax_details: {},
      spend_actual_lcu: Object.fromEntries(Object.entries(policy.spend_plan_pct_gdp).map(([key, ratio]) => [key, initialNominal * ratio / 100])),
      spend_plan_lcu: Object.fromEntries(Object.entries(policy.spend_plan_pct_gdp).map(([key, ratio]) => [key, initialNominal * ratio / 100])),
      debt_to_gdp_pct: country.debt_to_gdp_pct,
      tax_burden_pct: 0,
      budget_balance_pct_gdp: country.budget,
      gdp: country.gdp,
      inflation: country.inflation,
      budget: country.budget,
      unemployment: country.unemployment,
      growth: country.baseGrowth,
      trust: { ...country.trust },
      tax: 0,
      rate: country.rate,
      prev: { inflation: 0, gdp: 0, unemployment: 0 },
      last_causes: [],
      current_month_causes: [],
      cause_journal: [],
      decision_log: [],
      active_external_events: [],
      external_event_log: [],
      current_events: [],
      current_shocks: {},
      economic_history: []
    };
    state.nominal_gdp_history = Array(12).fill(initialNominal);
    state.balance_history = Array(12).fill(initialNominal * country.budget / 100 / 12);
    const details = calculateTaxRevenue(state, country, policy);
    const targetPrimarySpending = Math.max(0, details.taxRevenue + initialNominal * country.other_revenue_pct / 100
      - state.interest_lcu - initialNominal * country.budget / 1200);
    const spendScale = targetPrimarySpending / Math.max(0.01, sum(Object.values(policy.spend_plan_pct_gdp)) * initialNominal / 100);
    Object.keys(policy.spend_plan_pct_gdp).forEach((key) => {
      policy.spend_plan_pct_gdp[key] = Math.round(policy.spend_plan_pct_gdp[key] * spendScale * 10) / 10;
      state.spend_plan_lcu[key] = initialNominal * policy.spend_plan_pct_gdp[key] / 100;
      state.spend_actual_lcu[key] = state.spend_plan_lcu[key];
    });
    const calibratedSpendRatio = sum(Object.values(policy.spend_plan_pct_gdp));
    state.primary_spending_ratio_pct = calibratedSpendRatio;
    state.baseline_spending_ratio_pct = calibratedSpendRatio;
    state.baseline_investment_pct = policy.spend_plan_pct_gdp.infrastructure + policy.spend_plan_pct_gdp.education;
    state.investment_history = Array(24).fill(state.baseline_investment_pct);
    state.tax_details = details.by_tax;
    state.tax_revenue_lcu = details.taxRevenue;
    state.revenue_lcu = details.taxRevenue + state.other_revenue_lcu;
    state.tax_receipts_history = Array(12).fill(details.taxRevenue);
    state.tax_burden_pct = details.taxRevenue / initialNominal * 100;
    state.baseline_tax_burden_pct = state.tax_burden_pct;
    state.primary_spending_lcu = sum(Object.values(state.spend_actual_lcu));
    state.primary_balance_lcu = state.revenue_lcu - state.primary_spending_lcu;
    state.overall_balance_lcu = state.primary_balance_lcu - state.interest_lcu;
    state.budget_balance_pct_gdp = country.budget;
    state.budget = country.budget;
    state.tax = state.tax_burden_pct;
    beginExternalMonth(state, true);
    recordEconomicHistory(state);
    return state;
  }

  function recordEconomicHistory(state) {
    state.economic_history.push({
      month_number: state.month_number,
      real_gdp: state.real_gdp,
      inflation_yoy_pct: state.inflation_yoy_pct,
      unemployment_pct: state.unemployment_pct,
      budget_balance_pct_gdp: state.budget_balance_pct_gdp,
      debt_to_gdp_pct: state.debt_to_gdp_pct,
      tax_burden_pct: state.tax_burden_pct,
      policy_rate_pct: state.policy_rate_pct
    });
  }

  function queueDecision(state, decision) {
    state.queued_decision = copy(decision);
  }

  function calculateTaxRevenue(state, country, policy) {
    const effective = effectiveTaxRates(policy.taxes);
    const activity = Math.max(0.5, state.real_gdp / Math.max(1, state.potential_gdp));
    const reference = country.taxRates;
    const refEffective = effectiveTaxRates(reference);
    const quality = state.collection_quality;
    const by_tax = {};
    let taxRevenue = 0;
    for (const key of TAX_KEYS) {
      const meta = TAX_META[key];
      let referenceBase = meta.refBase;
      if (key === 'vat_main') referenceBase = reference.vat_taxable_share;
      const effectiveRate = effective[key];
      const previousRate = refEffective[key];
      const elasticity = key === 'vat_main' ? 1.1 : meta.elasticity;
      const marketMultiplier = key === 'resource' ? Math.max(0.1, 1 + (state.current_shocks?.export_price_pct || 0) / 100) : 1;
      const basePctGdp = referenceBase * activity * marketMultiplier * Math.exp(-elasticity * (effectiveRate - previousRate) / 100);
      const compliance = clamp(meta.compliance + (quality - 0.7) * 0.28 - Math.max(0, effectiveRate - previousRate) * 0.0015, 0.45, 0.995);
      const baseLcu = state.nominal_gdp_lcu * basePctGdp;
      const revenueLcu = baseLcu * effectiveRate / 100 * compliance;
      taxRevenue += revenueLcu;
      by_tax[key] = { label: TAX_META[key].label, effective_rate_pct: effectiveRate, base_lcu: baseLcu, base_pct_gdp: basePctGdp * 100, compliance_pct: compliance * 100, revenue_lcu: revenueLcu };
    }
    return { taxRevenue, by_tax };
  }

  function schedulePolicyChanges(state, nextPolicy, country) {
    const previousRate = state.policy.policy_rate_pct;
    const nextRate = nextPolicy.policy_rate_pct;
    const rateChange = nextRate - previousRate;
    if (Math.abs(rateChange) > 0.0001) state.rate_impulses.push({ age: 0, change_pp: rateChange });
    const oldVat = effectiveTaxRates(state.policy.taxes).vat_main;
    const newVat = effectiveTaxRates(nextPolicy.taxes).vat_main;
    if (Math.abs(newVat - oldVat) > 0.0001) {
      const totalPriceEffect = Math.log((100 + newVat) / (100 + oldVat)) * country.vat_cpi_pass_through;
      state.vat_impulses.push({ age: 0, total_log_effect: totalPriceEffect });
    }
  }

  function ageImpulses(state, deltaMonths) {
    state.rate_impulses.forEach((impulse) => { if (impulse.age < 99) impulse.age += deltaMonths; });
    state.vat_impulses.forEach((impulse) => { if (impulse.age < 99) impulse.age += deltaMonths; });
    state.rate_impulses = state.rate_impulses.filter((impulse) => impulse.age <= 24);
    state.vat_impulses = state.vat_impulses.filter((impulse) => impulse.age <= 4);
  }

  function beginExternalMonth(state, initial = false) {
    if (!initial) {
      state.active_external_events.forEach((event) => { event.months_left -= 1; });
      state.active_external_events = state.active_external_events.filter((event) => event.months_left > 0);
    }
    const month = state.month_number;
    const seededMonth = month + state.seed;
    const startEvent = (event) => {
      state.active_external_events.push(event);
      state.external_event_log.push({ id: event.id, source: event.source, month, duration_months: event.months_left, magnitude: event.magnitude });
    };
    if (seededMonth % 53 === 17) startEvent({ id: 'global-energy-' + month, source: 'Мировой энергетический рынок', channel: 'energy_inflation_pct', magnitude: 1.25, months_left: 2 });
    if (seededMonth % 67 === 31) startEvent({ id: 'harvest-' + month, source: 'Мировой продовольственный рынок', channel: 'food_inflation_pct', magnitude: 0.9, months_left: 2 });
    if (seededMonth % 89 === 43) startEvent({ id: 'exchange-' + month, source: 'Внешний валютный шок', channel: 'fx_change_pct', magnitude: 2.5, months_left: 1 });
    const shocks = { energy_inflation_pct: 0, food_inflation_pct: 0, fx_change_pct: 0, export_price_pct: 0 };
    const currentEvents = [];
    state.active_external_events.forEach((event) => {
      shocks[event.channel] += event.magnitude;
      currentEvents.push({ id: event.id, source: event.source, channel: event.channel, magnitude: event.magnitude });
      if (event.channel === 'energy_inflation_pct') shocks.export_price_pct += event.magnitude * 0.6;
    });
    state.current_events = currentEvents;
    state.current_shocks = shocks;
  }

  function monetaryPriceEffect(state, country) {
    let weightedImpulse = 0;
    for (const impulse of state.rate_impulses) {
      const age = impulse.age;
      if (age >= 3 && age <= 24) {
        const index = age - 3;
        const lower = Math.floor(index);
        const fraction = index - lower;
        const first = RATE_WEIGHTED[lower] || 0;
        const second = RATE_WEIGHTED[lower + 1] || 0;
        weightedImpulse += impulse.change_pp * (first + (second - first) * fraction);
      }
    }
    return -(country.rate_price_impact_pct / 100) * weightedImpulse;
  }

  function monetaryOutputEffect(state) {
    let effect = 0;
    for (const impulse of state.rate_impulses) {
      if (impulse.age >= 2 && impulse.age <= 12) {
        const index = impulse.age - 2;
        const lower = Math.floor(index);
        const fraction = index - lower;
        const first = OUTPUT_WEIGHTS[lower] || 0;
        const second = OUTPUT_WEIGHTS[lower + 1] || 0;
        effect += impulse.change_pp * (first + (second - first) * fraction);
      }
    }
    return -0.48 * effect;
  }

  function vatPriceEffect(state) {
    const schedule = [0.16, 0.34, 0.31, 0.19];
    return state.vat_impulses.reduce((total, impulse) => {
      const monthBand = Math.max(0, Math.ceil(impulse.age) - 1);
      return total + impulse.total_log_effect * (schedule[monthBand] || 0);
    }, 0);
  }

  function basketIndex(components) {
    return COMPONENTS.reduce((total, component) => total + component.weight * components[component.key], 0);
  }

  function solveRatePassThrough(baseComponents, rateEffect) {
    if (!rateEffect) return baseComponents;
    const oldIndex = basketIndex(baseComponents);
    const targetIndex = oldIndex * Math.exp(rateEffect);
    const norm = COMPONENTS.reduce((total, component) => total + component.weight * baseComponents[component.key] * component.rateSensitivity, 0) / oldIndex;
    let low = rateEffect < 0 ? rateEffect * 4 : 0;
    let high = rateEffect > 0 ? rateEffect * 4 : 0;
    for (let i = 0; i < 36; i++) {
      const middle = (low + high) / 2;
      const value = COMPONENTS.reduce((total, component) => total + component.weight * baseComponents[component.key] * Math.exp(middle * component.rateSensitivity / Math.max(0.01, norm)), 0);
      if ((value < targetIndex) === (rateEffect > 0)) low = middle;
      else high = middle;
    }
    const scale = (low + high) / 2;
    const result = {};
    COMPONENTS.forEach((component) => { result[component.key] = baseComponents[component.key] * Math.exp(scale * component.rateSensitivity / Math.max(0.01, norm)); });
    return result;
  }

  function advanceDebt(state, country, deltaMonths) {
    const oldDebt = state.debt_lcu;
    let interestRate = 0;
    const remaining = [];
    let principalDue = 0;
    for (const cohort of state.debt_cohorts) {
      interestRate += cohort.balance_lcu * cohort.coupon_pct / 1200;
      cohort.months_to_maturity -= deltaMonths;
      if (cohort.months_to_maturity <= 0) principalDue += cohort.balance_lcu;
      else remaining.push(cohort);
    }
    state.interest_lcu = interestRate;
    const primarySpending = sum(Object.values(state.spend_actual_lcu));
    state.primary_spending_lcu = primarySpending;
    const balance = state.revenue_lcu - primarySpending - interestRate;
    let netBorrowing = balance < 0 ? -balance * state.policy.borrowing_share_pct / 100 : Math.max(-oldDebt / deltaMonths, -balance);
    if (state.cash_lcu + (balance + netBorrowing) * deltaMonths < 0) {
      netBorrowing += -(state.cash_lcu + (balance + netBorrowing) * deltaMonths) / deltaMonths;
    }
    const targetDebt = Math.max(0, oldDebt + netBorrowing * deltaMonths);
    const debtAfterMaturities = oldDebt - principalDue;
    if (targetDebt < debtAfterMaturities && debtAfterMaturities > 0) {
      const scale = targetDebt / debtAfterMaturities;
      remaining.forEach((cohort) => { cohort.balance_lcu *= scale; });
    }
    const currentDebt = sum(remaining.map((cohort) => cohort.balance_lcu));
    const issuance = Math.max(0, targetDebt - currentDebt);
    if (issuance > 0) {
      const annualGdp = Math.max(1, state.nominal_gdp_lcu * 12);
      const debtRatio = targetDebt / annualGdp;
      const deficitRatio = Math.max(0, -balance / Math.max(1, state.nominal_gdp_lcu));
      const riskPremium = clamp(0.35 + Math.max(0, debtRatio - 0.6) * 3.2 + deficitRatio * 2, 0, 10);
      const newYield = clamp(state.policy_rate_pct + country.new_debt_term_premium_pct + riskPremium, 0.1, 40);
      remaining.push({ balance_lcu: issuance, coupon_pct: newYield, months_to_maturity: 120 });
    }
    state.debt_cohorts = remaining.filter((cohort) => cohort.balance_lcu > 0.000001);
    state.debt_lcu = targetDebt;
    state.primary_balance_lcu = state.revenue_lcu - primarySpending;
    state.overall_balance_lcu = balance;
    state.net_borrowing_lcu = netBorrowing;
    state.cash_lcu += (balance + netBorrowing) * deltaMonths;
    return { interest: interestRate, primarySpending, balance, netBorrowing };
  }

  function prepareEconomyState(state) {
    state.month_progress = Number.isFinite(state.month_progress) ? state.month_progress : 0;
    state.month_flows = state.month_flows || { gdp: 0, taxes: 0, balance: 0 };
    state.cpi_month_start = Number.isFinite(state.cpi_month_start) ? state.cpi_month_start : (state.cpi_index || 100);
    state.core_cpi_month_start = Number.isFinite(state.core_cpi_month_start) ? state.core_cpi_month_start : (state.core_cpi_index || 100);
    state.current_month_causes = state.current_month_causes || [];
    state.current_shocks = state.current_shocks || {};
    state.current_events = state.current_events || [];
    state.active_external_events = state.active_external_events || [];
    state.external_event_log = state.external_event_log || [];
    state.rate_impulses = state.rate_impulses || [];
    state.vat_impulses = state.vat_impulses || [];
    return state;
  }

  function advanceMonth(state, country, shocks = {}, recordHistory = true) {
    return advanceStep(state, country, 1, true, shocks, recordHistory);
  }

  function advanceTick(state, country, deltaMonths, monthBoundary = false) {
    return advanceStep(state, country, deltaMonths, monthBoundary, {}, true);
  }

  function advanceStep(state, country, deltaMonths, monthBoundary, shocks = {}, recordHistory = true) {
    prepareEconomyState(state);
    const previousLoanRate = state.loan_rate_pct;
    const previousInvestmentIndex = state.private_investment_index;
    const previousGdp = state.gdp;
    const previousPolicyRate = state.policy.policy_rate_pct;
    const previousInflation = state.inflation_yoy_pct;
    const previousRealGdp = state.real_gdp;
    const previousUnemployment = state.unemployment_pct;
    const previousBudget = state.budget_balance_pct_gdp;
    const causes = [];
    if (state.queued_decision) {
      const nextPolicy = state.queued_decision;
      const rateChange = nextPolicy.policy_rate_pct - state.policy.policy_rate_pct;
      const taxChange = TAX_KEYS.some((key) => nextPolicy.taxes[key === 'vat_main' ? 'vat_main_pct' : key + '_pct'] !== state.policy.taxes[key === 'vat_main' ? 'vat_main_pct' : key + '_pct']);
      schedulePolicyChanges(state, nextPolicy, country);
      state.policy = nextPolicy;
      state.queued_decision = null;
      causes.push({ id: 'policy-decision', channel: 'policy', effect: 'applied_next_tick', rate_change_pp: rateChange, tax_change: taxChange, lag_months: 0 });
    }
    ageImpulses(state, deltaMonths);
    const qualityAdjustment = 1 - Math.pow(1 - 0.15, deltaMonths);
    state.collection_quality += (state.policy.admin_quality - state.collection_quality) * qualityAdjustment;
    const monthlyShocks = { ...state.current_shocks };
    Object.entries(shocks).forEach(([key, value]) => { monthlyShocks[key] = (monthlyShocks[key] || 0) + value; });

    const loanTarget = state.policy.policy_rate_pct + country.loan_spread_pct;
    const depositTarget = Math.max(0, state.policy.policy_rate_pct - country.deposit_spread_pct);
    const bankRateAdjustment = 1 - Math.pow(0.5, deltaMonths);
    state.loan_rate_pct += (loanTarget - state.loan_rate_pct) * bankRateAdjustment;
    state.deposit_rate_pct += (depositTarget - state.deposit_rate_pct) * bankRateAdjustment;
    state.policy_rate_pct = state.policy.policy_rate_pct;

    const oldNominalGdp = state.nominal_gdp_lcu;
    for (const key of SPEND_KEYS) {
      const speed = key === 'infrastructure' || key === 'education' ? 0.16 : key === 'social' ? 0.42 : 0.28;
      const adminOperatingCost = key === 'administration' ? Math.max(0, state.policy.admin_quality - 0.72) * 0.5 : 0;
      const target = oldNominalGdp * (state.policy.spend_plan_pct_gdp[key] + adminOperatingCost) / 100;
      const current = state.spend_actual_lcu[key] || target;
      const tickSpeed = 1 - Math.pow(1 - speed, deltaMonths);
      state.spend_actual_lcu[key] = current + (target - current) * tickSpeed;
      state.spend_plan_lcu[key] = target;
    }
    const currentSpendRatio = sum(Object.values(state.spend_actual_lcu)) / Math.max(1, oldNominalGdp) * 100;
    const taxEstimate = calculateTaxRevenue(state, country, state.policy);
    const currentTaxBurdenEstimate = taxEstimate.taxRevenue / Math.max(1, oldNominalGdp) * 100;
    const fiscalDemand = clamp((currentSpendRatio - state.baseline_spending_ratio_pct) * country.fiscal_multiplier_pct
      - (currentTaxBurdenEstimate - state.baseline_tax_burden_pct) * country.tax_demand_multiplier
      - ((state.policy.taxes.payroll_pct * state.policy.payroll_employer_share_pct / 100) - (country.taxRates.payroll_pct * 0.7)) * 0.05
      - ((state.policy.taxes.pit_pct + state.policy.taxes.payroll_pct * (1 - state.policy.payroll_employer_share_pct / 100))
        - (country.taxRates.pit_pct + country.taxRates.payroll_pct * 0.3)) * 0.035, -7, 7);
    const monetaryDemand = monetaryOutputEffect(state);
    state.private_investment_index *= Math.exp(monetaryDemand / 100 * deltaMonths);
    if (Math.abs(monetaryDemand) > 0.005) causes.push({ id: 'credit-output-channel', channel: 'demand', effect: monetaryDemand < 0 ? 'investment_and_output_cooling' : 'investment_and_output_support', loan_rate_change_pp: state.loan_rate_pct - previousLoanRate, investment_change_pct: (state.private_investment_index / previousInvestmentIndex - 1) * 100, lag_months: 2 });
    const targetGap = clamp(fiscalDemand + monetaryDemand, -12, 12);
    const gapAdjustment = 1 - Math.pow(1 - 0.18, deltaMonths);
    state.output_gap_pct = clamp(state.output_gap_pct + (targetGap - state.output_gap_pct) * gapAdjustment, -18, 18);

    const currentInvestmentRatio = ((state.spend_actual_lcu.infrastructure || 0) + (state.spend_actual_lcu.education || 0)) / Math.max(1, oldNominalGdp) * 100;
    if (monthBoundary) {
      state.investment_history.push(currentInvestmentRatio);
      if (state.investment_history.length > 24) state.investment_history.shift();
    } else if (state.investment_history.length) {
      state.investment_history[state.investment_history.length - 1] = currentInvestmentRatio;
    }
    const averageInvestment = sum(state.investment_history) / state.investment_history.length;
    const investmentDelta = averageInvestment - state.baseline_investment_pct;
    const potentialGrowthAnnualPct = country.baseGrowth + clamp(investmentDelta * 0.035, -0.45, 0.45);
    state.potential_gdp *= Math.exp(potentialGrowthAnnualPct / 1200 * deltaMonths);
    state.real_gdp = Math.max(20, state.potential_gdp * (1 + state.output_gap_pct / 100));
    const realGrowthPct = (state.real_gdp / previousRealGdp - 1) * 100;

    const nominalDeflatorLog = (Math.log1p(country.inflation / 100) / 1200 + (monthlyShocks.gdp_deflator_pct || 0) / 1200) * deltaMonths;
    state.gdp_deflator_index *= Math.exp(nominalDeflatorLog);
    state.nominal_gdp_lcu = country.monthly_gdp_lcu * (state.real_gdp / 100) * (state.gdp_deflator_index / 100);

    const taxResult = calculateTaxRevenue(state, country, state.policy);
    state.tax_details = taxResult.by_tax;
    state.tax_revenue_lcu = taxResult.taxRevenue;
    state.other_revenue_lcu = state.nominal_gdp_lcu * country.other_revenue_pct / 100;
    state.revenue_lcu = state.tax_revenue_lcu + state.other_revenue_lcu;
    state.primary_spending_lcu = sum(Object.values(state.spend_actual_lcu));

    const budgetResult = advanceDebt(state, country, deltaMonths);
    causes.push({ id: 'budget-financing', channel: 'budget', effect: budgetResult.balance < 0 ? 'deficit_financed_by_debt_or_cash' : 'surplus_reduces_debt_or_builds_cash', lag_months: 0 });

    const expectationLog = Math.log1p(clamp(state.inflation_expectation_pct, -5, 60) / 100) / 12 * deltaMonths;
    const ratePriceLog = monetaryPriceEffect(state, country) * deltaMonths;
    const coreDemandLog = (fiscalDemand * 0.008) / 12 * deltaMonths;
    const coreLog = expectationLog + coreDemandLog;
    const baseComponents = { ...state.cpi_components };
    baseComponents.core *= Math.exp(coreLog);
    baseComponents.food *= Math.exp(coreLog + (monthlyShocks.food_inflation_pct || 0) / 100 * deltaMonths);
    baseComponents.energy *= Math.exp(coreLog + (monthlyShocks.energy_inflation_pct || 0) / 100 * deltaMonths);
    baseComponents.imported *= Math.exp(coreLog + ((monthlyShocks.fx_change_pct || 0) * country.fx_to_import_pass_through) / 100 * deltaMonths);
    let priceComponents = solveRatePassThrough(baseComponents, ratePriceLog);
    const vatLog = vatPriceEffect(state) * deltaMonths;
    if (vatLog) Object.keys(priceComponents).forEach((key) => { priceComponents[key] *= Math.exp(vatLog); });
    state.cpi_components = priceComponents;
    const priorCpi = state.cpi_index;
    state.cpi_index = basketIndex(state.cpi_components);
    const tickInflationLog = Math.log(state.cpi_index / Math.max(0.01, priorCpi));
    state.inflation_mom_pct = (state.cpi_index / Math.max(0.01, state.cpi_month_start) - 1) * 100;
    state.cpi_history[state.cpi_history.length - 1] = state.cpi_index;
    const yearAgoCpi = state.cpi_history[0];
    state.inflation_yoy_pct = yearAgoCpi > 0 ? (state.cpi_index / yearAgoCpi - 1) * 100 : 0;
    state.core_cpi_index *= Math.exp(coreLog);
    state.core_cpi_history[state.core_cpi_history.length - 1] = state.core_cpi_index;
    state.core_inflation_yoy_pct = state.core_cpi_index / state.core_cpi_history[0] * 100 - 100;
    const expectationAdjustment = 1 - Math.pow(0.92, deltaMonths);
    state.inflation_expectation_pct = clamp(state.inflation_expectation_pct * (1 - expectationAdjustment) + previousInflation * expectationAdjustment, -2, 50);

    const employerTaxChange = (state.policy.taxes.payroll_pct * state.policy.payroll_employer_share_pct / 100) - (country.taxRates.payroll_pct * 0.7);
    const unemploymentTarget = clamp(country.unemployment - state.output_gap_pct * 0.32 + employerTaxChange * 0.06, 1, 30);
    const laborAdjustment = 1 - Math.pow(1 - 0.2, deltaMonths);
    state.unemployment_pct += (unemploymentTarget - state.unemployment_pct) * laborAdjustment;
    state.employment = country.population_millions * (1 - state.unemployment_pct / 100);
    const productivityMonthly = potentialGrowthAnnualPct / 1200 * deltaMonths;
    state.real_wage_index *= Math.exp(productivityMonthly - tickInflationLog);
    const trailingNominalGdp = sum(state.nominal_gdp_history.slice(-11)) + state.nominal_gdp_lcu;
    state.debt_to_gdp_pct = state.debt_lcu / Math.max(1, trailingNominalGdp) * 100;
    state.tax_burden_pct = calculateRollingRatio(state.tax_receipts_history, state.nominal_gdp_history, state.tax_revenue_lcu, state.nominal_gdp_lcu);
    state.budget_balance_pct_gdp = calculateRollingBalance(state.balance_history, state.nominal_gdp_history, budgetResult.balance, state.nominal_gdp_lcu);

    state.month_progress += deltaMonths;
    state.month_flows.gdp += state.nominal_gdp_lcu * deltaMonths;
    state.month_flows.taxes += state.tax_revenue_lcu * deltaMonths;
    state.month_flows.balance += budgetResult.balance * deltaMonths;
    state.primary_spending_ratio_pct = state.primary_spending_lcu / Math.max(1, state.nominal_gdp_lcu) * 100;
    state.gdp = country.gdp * state.real_gdp / 100 * state.gdp_deflator_index / 100;
    state.inflation = state.inflation_yoy_pct;
    state.budget = state.budget_balance_pct_gdp;
    state.unemployment = state.unemployment_pct;
    state.growth = deltaMonths > 0 ? realGrowthPct / deltaMonths * 12 : 0;
    state.tax = state.tax_burden_pct;
    state.rate = state.policy_rate_pct;
    const trustDelta = clamp(realGrowthPct * 0.12 - (state.inflation_yoy_pct - previousInflation) * 0.06 + (state.budget_balance_pct_gdp - previousBudget) * 0.025, -1.1, 1.1);
    state.trust.people = clamp(state.trust.people + trustDelta, 3, 97);
    state.trust.elites = clamp(state.trust.elites + realGrowthPct * 0.08 - (state.policy.policy_rate_pct - previousPolicyRate) * 0.07, 3, 97);
    state.trust.government = clamp(state.trust.government + trustDelta * 0.55, 3, 97);
    state.trust.security = clamp(state.trust.security + (state.budget_balance_pct_gdp - previousBudget) * 0.035, 3, 97);
    state.prev = { inflation: state.inflation_yoy_pct - previousInflation, gdp: (state.gdp / Math.max(0.01, previousGdp) - 1) * 100, unemployment: state.unemployment_pct - previousUnemployment };
    if (Math.abs(ratePriceLog) > 0.000001) causes.push({ id: 'monetary-transmission', channel: 'prices', effect: ratePriceLog < 0 ? 'disinflationary' : 'inflationary', lag_months: 3 });
    if (Math.abs(vatLog) > 0.000001) causes.push({ id: 'vat-price-pass-through', channel: 'prices', effect: 'temporary_level_change', lag_months: 1 });
    state.current_events.forEach((event) => causes.push({ id: event.id, source: event.source, channel: event.channel, effect: 'temporary_external_shock', magnitude: event.magnitude, lag_months: 0 }));
    state.last_causes = causes;
    const causeIds = new Set(state.current_month_causes.map((cause) => cause.id));
    causes.forEach((cause) => {
      if (!causeIds.has(cause.id)) {
        state.current_month_causes.push(copy(cause));
        causeIds.add(cause.id);
      }
    });

    if (monthBoundary) {
      state.month_number += 1;
      state.nominal_gdp_history.push(state.month_flows.gdp);
      state.tax_receipts_history.push(state.month_flows.taxes);
      state.balance_history.push(state.month_flows.balance);
      [state.nominal_gdp_history, state.tax_receipts_history, state.balance_history].forEach((history) => { if (history.length > 12) history.shift(); });
      state.cpi_history.shift();
      state.cpi_history.push(state.cpi_index);
      state.core_cpi_history.shift();
      state.core_cpi_history.push(state.core_cpi_index);
      state.inflation_yoy_pct = state.cpi_index / Math.max(0.01, state.cpi_history[0]) * 100 - 100;
      state.core_inflation_yoy_pct = state.core_cpi_index / Math.max(0.01, state.core_cpi_history[0]) * 100 - 100;
      state.inflation = state.inflation_yoy_pct;
      state.cpi_month_start = state.cpi_index;
      state.core_cpi_month_start = state.core_cpi_index;
      state.inflation_mom_pct = 0;
      state.month_progress = 0;
      state.month_flows = { gdp: 0, taxes: 0, balance: 0 };
      state.last_causes = copy(state.current_month_causes);
      state.cause_journal.push({ month_number: state.month_number, causes: copy(state.current_month_causes) });
      if (state.cause_journal.length > 120) state.cause_journal.shift();
      if (decisionCauseIn(state.current_month_causes)) state.decision_log.push({ month_number: state.month_number, policy: copy(state.policy) });
      state.current_month_causes = [];
      beginExternalMonth(state);
      if (recordHistory) recordEconomicHistory(state);
    }
    return state;
  }

  function decisionCauseIn(causes) {
    return causes.some((cause) => cause.id === 'policy-decision');
  }

  function calculateRollingRatio(receiptHistory, gdpHistory, currentReceipts, currentGdp) {
    const receipts = sum(receiptHistory.slice(-11)) + currentReceipts;
    const gdp = sum(gdpHistory.slice(-11)) + currentGdp;
    return gdp > 0 ? receipts / gdp * 100 : 0;
  }

  function calculateRollingBalance(balanceHistory, gdpHistory, currentBalance, currentGdp) {
    const balance = sum(balanceHistory.slice(-11)) + currentBalance;
    const gdp = sum(gdpHistory.slice(-11)) + currentGdp;
    return gdp > 0 ? balance / gdp * 100 : 0;
  }

  function forecast(state, country, currentDraft) {
    const horizons = [1, 6, 12, 24];
    const forecastBase = {
      ...state,
      economic_history: [],
      month_progress: 0,
      month_flows: { gdp: 0, taxes: 0, balance: 0 },
      current_month_causes: []
    };
    const central = copy(forecastBase);
    central.queued_decision = copy(currentDraft);
    const low = copy(forecastBase);
    low.queued_decision = copy(currentDraft);
    const high = copy(forecastBase);
    high.queued_decision = copy(currentDraft);
    const values = { central: {}, low: {}, high: {} };
    for (let month = 1; month <= 24; month++) {
      advanceMonth(central, country, {}, false);
      advanceMonth(low, country, { energy_inflation_pct: -0.08, food_inflation_pct: -0.025 }, false);
      advanceMonth(high, country, { energy_inflation_pct: 0.10, food_inflation_pct: 0.035 }, false);
      if (horizons.includes(month)) {
        for (const [scenario, projected] of Object.entries({ central, low, high })) {
          values[scenario][month] = {
            inflation_yoy_pct: projected.inflation_yoy_pct,
            core_inflation_yoy_pct: projected.core_inflation_yoy_pct,
            debt_to_gdp_pct: projected.debt_to_gdp_pct,
            output_gap_pct: projected.output_gap_pct
          };
        }
      }
    }
    return values;
  }

  window.EconomyModel = { TAX_META, TAX_KEYS, SPEND_KEYS, SPEND_LABELS, createEconomyState, prepareEconomyState, queueDecision, advanceTick, advanceMonth, forecast, effectiveTaxRates };
})();
