const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  keyFile: 'service-account.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

async function saveToSheet(row) {
  const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: '1iOZCmMFbnf4T0D_eBxGDDQofapTYPe-uuQkCL6GS8dw',
      range: 'Sheet1!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          row.loanNo,
          row.emiPartner,
          row.customerName,
          row.customerContact,
          row.customerAddress,
          row.emi,
          row.emiPaid,
          row.emiPending,
          row.downPayment,
          row.disbursementAmount,
          row.product,
          row.loanAmount,
          row.loanStartDate,
          row.loanEndDate,
          row.status,
          row.remarks,
          row.verified
        ]]
      }
    });
    console.log(`✅ Google Sheet append success: ${response.status} - ${response.statusText}`);
  } catch (err) {
    console.error(`❌ Google Sheet API Error: ${err.message}`);
    if (err.response) {
      console.error(`   Details: ${JSON.stringify(err.response.data)}`);
    }
    // Print service account email to help user check permissions
    const client = await auth.getClient();
    console.error(`   Using Service Account: ${client.email}`);
    throw err;
  }
}

module.exports = { saveToSheet };
