import { fact } from "./facts";

/**
 * The Mandatory Provident Fund, as it appears in a payslip.
 *
 * Two rules, both of which matter to this audience and neither of which is widely
 * known by it: below the floor you contribute nothing (but your employer still must),
 * and above the cap your contribution stops growing.
 */
export function mpfEmployee(monthly: number): number {
  if (monthly < fact("mpf-exempt-floor")) return 0;
  const base = Math.min(monthly, fact("mpf-income-cap"));
  return Math.min(Math.round(base * fact("mpf-rate")), fact("mpf-contribution-cap"));
}

/**
 * What the employer must put in alongside it.
 *
 * Never deducted from anything here — it exists so the game can show a player, once
 * they are stable enough to care, that there is money in their name they did not know
 * about. Employers owe this even on pay below the employee floor.
 */
export function mpfEmployer(monthly: number): number {
  const base = Math.min(monthly, fact("mpf-income-cap"));
  return Math.min(Math.round(base * fact("mpf-rate")), fact("mpf-contribution-cap"));
}
