const fs = require("fs");
const pdfParse = require("pdf-parse");

/**
 * Extract plain text from a PDF file
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function extractTextFromPDF(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);

    // IMPORTANT: pdf-parse returns a function directly
    const data = await pdfParse(buffer);

    if (!data || !data.text) {
      throw new Error("No text found in PDF");
    }

    return data.text;
  } catch (err) {
    console.error("❌ Error reading PDF:", err.message);
    throw err;
  }
}

module.exports = {
  extractTextFromPDF
};
