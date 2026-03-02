const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\urjit upadhyay\\Dropbox (Old)\\PC\\Desktop\\Restraunt_charity\\dashboard\\app\\feed\\page.tsx', 'utf8');

let stack = [];
let inQuotes = false;
let quoteChar = '';

for (let i = 0; i < content.length; i++) {
    let char = content[i];
    if (char === '"' || char === "'" || char === "`") {
        if (!inQuotes) {
            inQuotes = true;
            quoteChar = char;
        } else if (char === quoteChar) {
            inQuotes = false;
        }
    }
    if (!inQuotes) {
        if (char === '{') stack.push({ char, i });
        if (char === '}') {
            if (stack.length === 0) {
                console.log('Unmatched } at position', i);
            } else {
                stack.pop();
            }
        }
    }
}

if (stack.length > 0) {
    stack.forEach(s => console.log('Unmatched { at position', s.i));
} else {
    console.log('Braces are balanced (basic check)');
}
