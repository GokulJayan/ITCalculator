# Paisa — Indian income tax calculator

Live: https://itcalculatorindia.netlify.app

A client-side React + TypeScript estimate for India's new tax regime for FY 2026-27 (AY 2027–28). The tax engine is plain TypeScript and independent of React. Inputs are kept in the URL query string for sharing; no calculator inputs are sent to a server.

## Run locally

```sh
npm install
npm run dev
```

## Verify

```sh
npm test
npm run lint
npm run build
```

## Deploy to Netlify

Connect this project directory to Netlify. The included `netlify.toml` runs `npm run build` and publishes `dist`.

## Calculation assumptions

- Slabs, ₹75,000 salaried standard deduction, ₹60,000 rebate limit, marginal relief, surcharge tiers, and 4% cess are configured in `src/config/fy2026-27.ts`.
- This configuration follows the assumptions in the supplied implementation plan. It has **not** been independently verified against current official tax sources; confirm the law and rates before relying on or publishing the estimate.
- Rebate is excluded when the NRI input is enabled. Rebate marginal relief is modeled as a cap on tax at the income above the rebate threshold. Surcharge marginal relief is also modeled.
- Employer NPS is treated as a deductible amount entered by the user. Family-pension deduction is modeled as one-third of the entered amount, capped at ₹25,000.
- Employee PF is estimated as half of the combined PF rate applied to basic salary (6% of basic at the default 12% combined rate). Professional tax is a user-entered annual amount; no state schedules are included.
- Stock income, bonuses, referral bonuses, and dividends entered in Advanced inputs are included as taxable income using the calculator's slab model. Actual stock and dividend taxation depends on the type of income and applicable rules; this simplified estimate does not model those distinctions.
- Total income includes fixed salary and all additional income components; total income after tax is total income minus total estimated income tax. The monthly/yearly view scales total income and total tax to the selected period, and shows each additional component before tax, allocated tax, and after tax. Salary in-hand is shown separately and is calculated from fixed salary less salary-only income tax, employee PF, and professional tax, so additional components do not change this payroll estimate. The incremental tax from additional components is allocated proportionally across those components.
- These values are planning estimates. Actual deductions, payroll structure, eligibility, and tax treatment may differ.

This tool is for planning and education only, not tax advice or a substitute for official tax calculations.
