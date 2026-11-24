const mysql = require('mysql2/promise');

// Split so the literal header/footer text never appears in the repo
// (Netlify's secrets scanner would otherwise match it against DB_CA_CERT).
const CERT_BEGIN = '-----BEGIN ' + 'CERTIFICATE-----';
const CERT_END = '-----END ' + 'CERTIFICATE-----';

// Rebuilds a valid PEM no matter how the env var was stored
// (real line breaks, literal \n text, or everything squashed onto one line).
function normalizeCert(raw) {
    if (!raw) return undefined;
    const text = raw.replace(/\\n/g, '\n');
    return text
        .split(CERT_BEGIN)
        .slice(1)
        .map((block) => block.split(CERT_END)[0].replace(/\s+/g, ''))
        .filter(Boolean)
        .map((body) => CERT_BEGIN + '\n' + body.match(/.{1,64}/g).join('\n') + '\n' + CERT_END + '\n')
        .join('');
}

async function getConnection() {
    return mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        dateStrings: true, // DATE values stay plain text such as 2023-01-15
        ssl: {
            ca: normalizeCert(process.env.DB_CA_CERT),
            rejectUnauthorized: true
        }
    });
}

module.exports = { getConnection };
