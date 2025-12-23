const pdf = require('pdf-parse');
console.log('Type of pdf-parse:', typeof pdf);
console.log('Value of pdf-parse:', pdf);
try {
    const fs = require('fs');
    // create dummy buffer
    const buffer = Buffer.from('test');
    pdf(buffer).then(() => console.log('Called successfully')).catch(e => console.log('Call failed:', e.message));
} catch (e) {
    console.log('Immediate call failed:', e.message);
}
