function normalize(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function money(val) {
  return val ? val.replace(/[,₹]/g, '').trim() : '';
}

/* ===================== TVS CREDIT ===================== */
function extractTVSMetadata(text) {
  const t = normalize(text);

  // TVS: Matches "Loan No: X" OR "TVS/CDL/DO/X" pattern
  const loanNo = t.match(/(?:Loan\s*No\.?\s*[:\-]?\s*|TVS\/CDL\/DO\/)(\w+)/i)?.[1] || '';

  const customerName = t.match(/Customer\s*Name\s*[:\-]?\s*([A-Z ]+)/i)?.[1]?.trim() || '';
  const customerContact = t.match(/(Mobile|Contact)\s*No\.?\s*[:\-]?\s*(\d{10})/i)?.[2] || '';
  const customerAddress = t.match(/Address\s*[:\-]?\s*(.+?)\s*(EMI|Loan)/i)?.[1]?.trim() || '';

  const emiAmount = t.match(/EMI\s*Amount\s*[:\-]?\s*₹?\s*([\d,]+)/i)?.[1] || '';
  const tenure = t.match(/Tenure\s*[:\-]?\s*(\d+)/i)?.[1] || '';

  const emiPaid = t.match(/EMI\s*Paid\s*[:\-]?\s*(\d+)/i)?.[1] || '0';
  const emiPending = t.match(/EMI\s*Pending\s*[:\-]?\s*(\d+)/i)?.[1] || tenure;

  const downPayment = t.match(/Down\s*Payment\s*[:\-]?\s*₹?\s*([\d,]+)/i)?.[1] || '0';
  const disbursementAmount = t.match(/Disbursement\s*Amount\s*[:\-]?\s*₹?\s*([\d,]+)/i)?.[1] || '';

  const product = t.match(/Product\s*[:\-]?\s*([A-Za-z0-9 \-]+)/i)?.[1] || '';
  const loanAmount = t.match(/Loan\s*Amount\s*[:\-]?\s*₹?\s*([\d,]+)/i)?.[1] || '';

  const loanStartDate = t.match(/Loan\s*Start\s*Date\s*[:\-]?\s*([\d\/\-]+)/i)?.[1] || '';
  const loanEndDate = t.match(/Loan\s*End\s*Date\s*[:\-]?\s*([\d\/\-]+)/i)?.[1] || '';

  const status = t.match(/Status\s*[:\-]?\s*(Active|Closed|Pending)/i)?.[1] || 'Active';

  return {
    loanNo,
    emiPartner: 'TVS CREDIT',
    customerName,
    customerContact,
    customerAddress,
    emi: `${money(emiAmount)} × ${tenure}`,
    emiPaid,
    emiPending,
    downPayment: money(downPayment),
    disbursementAmount: money(disbursementAmount),
    product,
    loanAmount: money(loanAmount),
    loanStartDate,
    loanEndDate,
    status,
    remarks: 'Auto imported from TVS PDF',
    verified: 'YES'
  };
}

/* ===================== IDFC FIRST BANK ===================== */
function extractIDFCMetadata(text) {
  const t = normalize(text);

  // IDFC: Matches "Loan (Account/Reference) No: X" OR "Application ID X"
  // Capturing group is (\w+), but we need to handling the prefix non-capturing group carefully.
  // Regex from previous attempt: /(?:Loan\s*(?:Account|Reference)?\s*No\.?\s*[:\-]?|Application\s*ID)\s*(\w+)/i
  const loanNo = t.match(/(?:Loan\s*(?:Account|Reference)?\s*No\.?\s*[:\-]?|Application\s*ID)\s*(\w+)/i)?.[1] || '';

  // Note: Previous one used index [2], but my new regex has only 1 capturing group.

  const customerName = t.match(/Borrower\s*Name\s*[:\-]?\s*([A-Z ]+)/i)?.[1]?.trim() || '';
  const customerContact = t.match(/Mobile\s*No\.?\s*[:\-]?\s*(\d{10})/i)?.[1] || '';
  const customerAddress = t.match(/Address\s*[:\-]?\s*(.+?)\s*(EMI|Loan)/i)?.[1]?.trim() || '';

  const emiAmount = t.match(/EMI\s*Amount\s*₹?\s*([\d,]+)/i)?.[1] || '';
  const tenure = t.match(/Tenure\s*[:\-]?\s*(\d+)/i)?.[1] || '';

  const emiPaid = t.match(/EMI\s*Paid\s*[:\-]?\s*(\d+)/i)?.[1] || '0';
  const emiPending = t.match(/EMI\s*Pending\s*[:\-]?\s*(\d+)/i)?.[1] || tenure;

  const downPayment = t.match(/Down\s*Payment\s*₹?\s*([\d,]+)/i)?.[1] || '0';
  const disbursementAmount = t.match(/Disbursement\s*Amount\s*₹?\s*([\d,]+)/i)?.[1] || '';

  const product = t.match(/Product\s*[:\-]?\s*(.+?)\s*Loan/i)?.[1] || '';
  const loanAmount = t.match(/Sanctioned\s*Amount\s*₹?\s*([\d,]+)/i)?.[1] || '';

  const loanStartDate = t.match(/Start\s*Date\s*[:\-]?\s*([\d\/\-]+)/i)?.[1] || '';
  const loanEndDate = t.match(/End\s*Date\s*[:\-]?\s*([\d\/\-]+)/i)?.[1] || '';

  const status = t.match(/Status\s*[:\-]?\s*(Active|Closed|Pending)/i)?.[1] || 'Active';

  return {
    loanNo,
    emiPartner: 'IDFC FIRST BANK',
    customerName,
    customerContact,
    customerAddress,
    emi: `${money(emiAmount)} × ${tenure}`,
    emiPaid,
    emiPending,
    downPayment: money(downPayment),
    disbursementAmount: money(disbursementAmount),
    product,
    loanAmount: money(loanAmount),
    loanStartDate,
    loanEndDate,
    status,
    remarks: 'Auto imported from IDFC PDF',
    verified: 'YES'
  };
}

module.exports = {
  extractTVSMetadata,
  extractIDFCMetadata
};
