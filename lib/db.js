const { Pool } = require('pg');

// Keep the existing database and keys. Verify the database server's TLS certificate.
const connectionString = process.env.POSTGRES_URL;
let secureConnectionString = connectionString;
if (connectionString) {
  const url = new URL(connectionString);
  // pg connection-string SSL options otherwise override the explicit ssl object.
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'uselibpqcompat']) {
    url.searchParams.delete(key);
  }
  secureConnectionString = url.toString();
}

module.exports = new Pool({
  connectionString: secureConnectionString,
  ssl: {
    rejectUnauthorized: true,
    ...(process.env.POSTGRES_CA ? { ca: process.env.POSTGRES_CA } : {}),
  },
  max: 3,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});
