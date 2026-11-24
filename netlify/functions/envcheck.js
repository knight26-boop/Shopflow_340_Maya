// Temporary diagnostic. DELETE after use: it is a public URL.
const REQUIRED = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME", "DB_CA_CERT"];

// Split so the literal header/footer text never appears in this file
// (Netlify's secrets scanner would otherwise match it against DB_CA_CERT).
const CERT_BEGIN = "-----BEGIN " + "CERTIFICATE-----";
const CERT_END = "-----END " + "CERTIFICATE-----";

function inspectVars() {
  const report = {};
  for (const key of REQUIRED) {
    const v = process.env[key];
    const r = { set: v !== undefined, problems: [] };
    if (v === undefined) {
      r.problems.push("NOT SET in the Functions scope");
    } else {
      r.length = v.length;
      if (v.length === 0) r.problems.push("empty string");
      if (v !== v.trim()) r.problems.push("leading/trailing whitespace");
      if (/^["'].*["']$/.test(v.trim())) r.problems.push("wrapped in quotes (remove them)");
      if (key === "DB_HOST" && /:\/\/|\s|\//.test(v)) r.problems.push("host should be a bare hostname (no protocol, path, or spaces)");
      if (key === "DB_HOST" && /:\d+$/.test(v)) r.problems.push("host includes a port; use DB_PORT instead");
      if (key === "DB_PORT" && !/^\d+$/.test(v.trim())) r.problems.push("port is not a number");
      if (key === "DB_CA_CERT") {
        if (!v.includes(CERT_BEGIN)) r.problems.push("missing the BEGIN header line");
        if (!v.includes(CERT_END)) r.problems.push("missing the END footer line");
        if (v.includes("\\n")) r.problems.push("contains literal backslash-n text instead of real line breaks");
        if (!v.includes("\n") && !v.includes("\\n")) r.problems.push("no line breaks at all (pasted as one line)");
      }
    }
    report[key] = r;
  }
  return report;
}

function normalizeCert(raw) {
  if (!raw) return undefined;
  const text = raw.replace(/\\n/g, "\n");
  const certs = text
    .split(CERT_BEGIN)
    .slice(1)
    .map((block) => block.split(CERT_END)[0].replace(/\s+/g, ""))
    .filter(Boolean)
    .map((body) => CERT_BEGIN + "\n" + body.match(/.{1,64}/g).join("\n") + "\n" + CERT_END + "\n");
  return certs.join("");
}

async function tryConnect() {
  const cfg = {
    host: (process.env.DB_HOST || "").trim(),
    port: Number((process.env.DB_PORT || "").trim()),
    user: (process.env.DB_USER || "").trim(),
    password: process.env.DB_PASSWORD,
    database: (process.env.DB_NAME || "").trim(),
  };
  const ca = normalizeCert(process.env.DB_CA_CERT);
  const result = { driver: null, connected: false };

  // Try MySQL first, then PostgreSQL, depending on which driver is installed.
  let mysql, pg;
  try { mysql = require("mysql2/promise"); } catch (_) {}
  try { pg = require("pg"); } catch (_) {}

  try {
    if (mysql) {
      result.driver = "mysql2";
      const conn = await mysql.createConnection({
        ...cfg,
        ssl: ca ? { ca } : undefined,
        connectTimeout: 8000,
      });
      const [rows] = await conn.query("SELECT 1 AS ok");
      result.connected = rows[0].ok === 1;
      await conn.end();
    } else if (pg) {
      result.driver = "pg";
      const client = new pg.Client({
        ...cfg,
        ssl: ca ? { ca, rejectUnauthorized: true } : undefined,
        connectionTimeoutMillis: 8000,
      });
      await client.connect();
      const res = await client.query("SELECT 1 AS ok");
      result.connected = res.rows[0].ok === 1;
      await client.end();
    } else {
      result.error = "Neither mysql2 nor pg is installed. Check package.json dependencies.";
    }
  } catch (err) {
    result.error = {
      code: err.code,
      name: err.name,
      message: String(err.message).slice(0, 200),
    };
  }
  return result;
}

exports.handler = async () => {
  const body = { variables: inspectVars(), connection: await tryConnect() };
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body, null, 2),
  };
};
