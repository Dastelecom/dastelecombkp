require("dotenv").config();

const imaps = require("imap-simple");
const { simpleParser } = require("mailparser");
const fs = require("fs-extra");
const path = require("path");

const { extractTextFromPDF } = require("./pdfParser");
const { extractTVSMetadata, extractIDFCMetadata } = require("./metadataExtractor");
const { saveToSheet } = require("./googleSheet");

const IMAP_CONFIG = {
  imap: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    authTimeout: 15000,
    tlsOptions: {
      rejectUnauthorized: false
    }
  }
};


const PROCESSED_UIDS_FILE = path.join(__dirname, "processed_uids.json");
let processedUids = [];

try {
  if (fs.existsSync(PROCESSED_UIDS_FILE)) {
    processedUids = fs.readJsonSync(PROCESSED_UIDS_FILE);
  }
} catch (error) {
  console.log("⚠️ Could not load processed UIDs, starting fresh.");
}

async function saveProcessedUid(uid) {
  processedUids.push(uid);
  try {
    await fs.writeJson(PROCESSED_UIDS_FILE, processedUids);
  } catch (error) {
    console.error("❌ Error saving processed UID:", error);
  }
}

async function checkEmails() {
  console.log("🔄 Checking bank emails...");

  let connection;

  try {
    connection = await imaps.connect(IMAP_CONFIG);
    await connection.openBox("INBOX");

    const searchCriteria = [
      ['OR',
        ['FROM', 'noreply@tvscredit.com'],
        ['FROM', 'noreply@idfcfirstbank.com']
      ]
    ];
    const fetchOptions = {
      bodies: [""],
      struct: true // fetch struct to get uid
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`🔍 Found ${messages.length} unread emails.`);

    if (!messages.length) {
      console.log("📭 No new emails");
      return;
    }

    for (const item of messages) {
      if (processedUids.includes(item.attributes.uid)) {
        // console.log(`⏩ Skipping processed email (UID: ${item.attributes.uid})`);
        continue;
      }

      console.log(`🆕 Processing new email (UID: ${item.attributes.uid})`);
      try {
        const all = item.parts.find(p => p.which === "");
        const mail = await simpleParser(all.body);

        const from = (mail.from?.text || "").toLowerCase();
        console.log(`📨 Processing email from: ${from}`);

        let bank = null;
        let saveDir = null;

        if (from.includes("noreply@tvscredit.com")) {
          bank = "TVS";
          saveDir = path.join(__dirname, "pdfs", "tvs");
          console.log("📧 TVS email detected");
        } else if (from.includes("noreply@idfcfirstbank.com")) {
          bank = "IDFC";
          saveDir = path.join(__dirname, "pdfs", "idfc");
          console.log("📧 IDFC email detected");
        }
        else {
          console.log("⚠️ Email skipped (unknown sender)");
          continue;
        }

        if (!mail.attachments?.length) {
          console.log("⚠️ No attachments found");
          continue;
        }

        await fs.ensureDir(saveDir);

        for (const attachment of mail.attachments) {
          const filename = attachment.filename?.toLowerCase() || "";

          // ❌ Skip non-EMI PDFs
          if (
            !filename.endsWith(".pdf") ||
            filename.includes("agreement") ||
            filename.includes("application")
          ) {
            continue;
          }

          const filePath = path.join(
            saveDir,
            `${Date.now()}-${attachment.filename}`
          );

          await fs.writeFile(filePath, attachment.content);
          console.log(`📄 PDF saved: ${filePath}`);

          try {
            const text = await extractTextFromPDF(filePath);

            let data;
            if (bank === "TVS") data = extractTVSMetadata(text);
            if (bank === "IDFC") data = extractIDFCMetadata(text);

            if (!data || !data.loanNo) {
              console.log("⚠️ Loan number not found. Extracted text snippet:");
              console.log(text.substring(0, 500)); // Log first 500 chars to debug
              continue;
            }

            data.partner = bank === "TVS" ? "TVS Credit" : "IDFC First Bank";
            data.remarks = "Auto imported from bank PDF";
            data.verified = "NO";

            await saveToSheet(data);
            await saveProcessedUid(item.attributes.uid);

            console.log(`📊 Metadata saved for loan ${data.loanNo}`);
          } catch (pdfErr) {
            console.error("❌ PDF processing error:", pdfErr.message);
          }
        }
      } catch (mailErr) {
        console.error("❌ Error processing email:", mailErr.message);
      }
    }
  } catch (err) {
    console.error("❌ IMAP connection error:", err.message);
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch { }
    }
  }
}

module.exports = { checkEmails };
