const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
let env = fs.readFileSync(envPath, 'utf8');

// Use a regex that can handle multi-line within quotes
const pkMatch = env.match(/FIREBASE_PRIVATE_KEY="([\s\S]+?)"/);

if (pkMatch) {
    let key = pkMatch[1];

    // Replace all real newlines (\n, \r\n) with literal \n
    key = key.replace(/\r?\n/g, '\\n');

    // Replace any existing literal \n with themselves (double backslash n to single backslash n)
    // Actually, if it's already \n literal in the string, it becomes \\n in the code.
    // Let's just normalize to single-line with literal \n
    key = key.replace(/\\n/g, '\n').replace(/\n/g, '\\n');

    // Clean up any potential double \\n
    key = key.replace(/\\\\n/g, '\\n');

    const newEnv = env.replace(pkMatch[1], key);
    fs.writeFileSync(envPath, newEnv);
    console.log('✅ Firebase Private Key normalized to single line in .env');
} else {
    console.log('❌ Could not find FIREBASE_PRIVATE_KEY in .env');
}
