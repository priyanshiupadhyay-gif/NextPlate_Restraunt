const disposableEmails = require('disposable-email-domains');

/**
 * Validates if an email is from a disposable/temporary domain
 */
exports.isDisposableEmail = (email) => {
    if (!email || !email.includes('@')) return false;
    const domain = email.split('@')[1].toLowerCase();
    return disposableEmails.includes(domain);
};

/**
 * Validates basic email format
 */
exports.isValidEmail = (email) => {
    const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(String(email).toLowerCase());
};
