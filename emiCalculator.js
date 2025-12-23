/**
 * EMI Auto Calculation Utility
 * Used by SmartBiller
 */

function calculateEMIStatus({
  loanAmount = 0,
  emiAmount = 0,
  tenure = 0,
  emiPaidCount = 0,
  firstEmiDate
}) {
  // safety checks
  loanAmount = Number(loanAmount) || 0;
  emiAmount = Number(emiAmount) || 0;
  tenure = Number(tenure) || 0;
  emiPaidCount = Number(emiPaidCount) || 0;

  const totalPayable = emiAmount * tenure;
  const emiPendingCount = Math.max(tenure - emiPaidCount, 0);
  const outstandingAmount = emiPendingCount * emiAmount;

  // calculate next EMI date
  let nextEmiDate = '';
  if (firstEmiDate) {
    const d = new Date(firstEmiDate);
    d.setMonth(d.getMonth() + emiPaidCount + 1);
    nextEmiDate = d.toISOString().split('T')[0];
  }

  // loan status
  let status = 'Active';
  if (emiPendingCount === 0 && tenure > 0) status = 'Closed';

  return {
    totalPayable,
    emiPaidCount,
    emiPendingCount,
    outstandingAmount,
    nextEmiDate,
    status
  };
}

module.exports = { calculateEMIStatus };
