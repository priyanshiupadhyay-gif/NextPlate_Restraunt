const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const pk = process.env.FIREBASE_PRIVATE_KEY;
console.log('Original Length:', pk.length);
const replaced = pk.replace(/\\n/g, '\n');
console.log('Replaced Length:', replaced.length);
console.log('First 50 chars:', JSON.stringify(replaced.slice(0, 50)));
console.log('Last 50 chars:', JSON.stringify(replaced.slice(-50)));

if (replaced.includes('-----BEGIN PRIVATE KEY-----')) {
    console.log('Starts with Header: YES');
} else {
    console.log('Starts with Header: NO');
}

if (replaced.includes('-----END PRIVATE KEY-----')) {
    console.log('Ends with Footer: YES');
} else {
    console.log('Ends with Footer: NO');
}

try {
    const crypto = require('crypto');
    crypto.createPrivateKey(replaced);
    console.log('Crypto valid: YES');
} catch (e) {
    console.log('Crypto valid: NO');
    console.log('Error:', e.message);
}
