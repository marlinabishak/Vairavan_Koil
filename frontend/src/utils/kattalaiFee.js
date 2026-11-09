/**
 * Utility to calculate Nithiya Kattalai registration fee.
 * 
 * Rules:
 * 1. Base Nithiya Kattalai endowment fee (default: ₹3,500, configurable in system settings).
 * 2. If the chosen Kattalai Date falls within 6 months of the registration date,
 *    an additional 1st-year Archanai Charge (default: ₹200, configurable in system settings) applies.
 * 3. If the Kattalai Date is more than 6 months away, the Archanai Charge is waived (₹0),
 *    as the endowment interest will mature in time for the annual pooja.
 */

export function calculateKattalaiFee({
  kattalaiDate,
  regnDate = new Date(),
  baseAmount = 3500,
  archanaiFee = 200
} = {}) {
  const base = Number(baseAmount) >= 0 ? Number(baseAmount) : 3500;
  const arch = Number(archanaiFee) >= 0 ? Number(archanaiFee) : 200;

  const reg = regnDate ? new Date(regnDate) : new Date();
  reg.setHours(0, 0, 0, 0);

  let targetMonth = null;
  let targetDay = null;

  if (typeof kattalaiDate === 'string') {
    const parts = kattalaiDate.split('-').map(Number);
    if (parts.length === 3) {
      targetMonth = parts[1];
      targetDay = parts[2];
    } else if (parts.length === 2) {
      targetMonth = parts[0];
      targetDay = parts[1];
    }
  } else if (kattalaiDate && typeof kattalaiDate === 'object') {
    if (kattalaiDate instanceof Date && !isNaN(kattalaiDate)) {
      targetMonth = kattalaiDate.getMonth() + 1;
      targetDay = kattalaiDate.getDate();
    } else if (kattalaiDate.kattalai_month !== undefined) {
      targetMonth = Number(kattalaiDate.kattalai_month);
      targetDay = Number(kattalaiDate.kattalai_date || 1);
    } else if (kattalaiDate.month !== undefined) {
      targetMonth = Number(kattalaiDate.month);
      targetDay = Number(kattalaiDate.date || kattalaiDate.day || 1);
    }
  }

  // Fallback if date is not specified yet
  if (!targetMonth || !targetDay || isNaN(targetMonth) || isNaN(targetDay)) {
    return {
      baseAmount: base,
      archanaiFee: arch,
      isWithinSixMonths: true,
      archanaiCharge: arch,
      totalAmount: base + arch,
      nextOccurrence: null
    };
  }

  // Determine the next upcoming occurrence of this annual kattalai
  let target = new Date(reg.getFullYear(), targetMonth - 1, targetDay);
  target.setHours(0, 0, 0, 0);

  if (target < reg) {
    target = new Date(reg.getFullYear() + 1, targetMonth - 1, targetDay);
    target.setHours(0, 0, 0, 0);
  }

  // 6 months threshold from registration date (e.g. Feb 10 -> Aug 10)
  const sixMonthsLater = new Date(reg);
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
  sixMonthsLater.setHours(23, 59, 59, 999);

  const isWithinSixMonths = target <= sixMonthsLater;
  const archanaiCharge = isWithinSixMonths ? arch : 0;
  const totalAmount = base + archanaiCharge;

  return {
    baseAmount: base,
    archanaiFee: arch,
    isWithinSixMonths,
    archanaiCharge,
    totalAmount,
    nextOccurrence: target
  };
}
