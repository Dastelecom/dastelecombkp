require('dotenv').config();

module.exports = {
  imap: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    authTimeout: 10000,

    // ✅ THIS FIXES THE ERROR
    tlsOptions: {
      rejectUnauthorized: false
    }
  }
};
