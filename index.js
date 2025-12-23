require('dotenv').config();

const cron = require('node-cron');
const { checkEmails } = require('./emailChecker');

console.log('🚀 SmartBiller Auto Email Checker Started');
console.log('IMAP HOST =', process.env.IMAP_HOST); // 🔍 DEBUG LINE

(async () => {
  console.log('🧪 Initial run');
  await checkEmails();
})();

cron.schedule('*/10 * * * *', async () => {
  console.log('⏰ Scheduled email check');
  await checkEmails();
});
