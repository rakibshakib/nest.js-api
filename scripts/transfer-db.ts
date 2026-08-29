import 'dotenv/config';
import type { ConnectionConfig } from 'mariadb';
import mariadb from 'mariadb';

const TABLES = [
  'User',
  'Admin',
  'Vendor',
  'Customer',
  'Category',
  'VendorCategory',
  'Note',
  'Service',
  'ServiceVariation',
  'VendorService',
];

const LOCAL_DB: ConnectionConfig = {
  host: process.env.LOCAL_DB_HOST || 'localhost',
  port: Number(process.env.LOCAL_DB_PORT) || 3306,
  user: process.env.LOCAL_DB_USER || 'root',
  password: process.env.LOCAL_DB_PASSWORD || '',
  database: process.env.LOCAL_DB_NAME || 'service_db',
};

const TIDB_DB: ConnectionConfig = {
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT) || 4000,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME || 'test',
  ssl: true,
  connectTimeout: 30000,
};

const direction = process.argv[2] || 'local-to-server';

async function transfer(
  source: ConnectionConfig,
  target: ConnectionConfig,
  label: string,
) {
  console.log(`\nSyncing: ${label}\n`);

  const srcConn = await mariadb.createConnection(source);
  const tgtConn = await mariadb.createConnection(target);

  for (const table of TABLES) {
    try {
      const rows = await srcConn.query(`SELECT * FROM \`${table}\``);
      if (rows.length === 0) {
        console.log(`  ${table}: 0 rows (skipped)`);
        continue;
      }

      const columns = Object.keys(rows[0]);
      const insertSQL = `INSERT INTO \`${table}\` (${columns.map((c) => `\`${c}\``).join(', ')}) VALUES (${columns.map(() => '?').join(', ')}) ON DUPLICATE KEY UPDATE ${columns.map((c) => `\`${c}\` = VALUES(\`${c}\`)`).join(', ')}`;

      let count = 0;
      for (const row of rows) {
        const values = columns.map((c) => row[c]);
        await tgtConn.query(insertSQL, values);
        count++;
      }
      console.log(`  ${table}: ${count} rows`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ${table}: ERROR - ${message}`);
    }
  }

  await srcConn.end();
  await tgtConn.end();
  console.log('\nDone!');
}

if (direction === 'local-to-server') {
  transfer(LOCAL_DB, TIDB_DB, 'Local MySQL → TiDB Cloud');
} else if (direction === 'server-to-local') {
  transfer(TIDB_DB, LOCAL_DB, 'TiDB Cloud → Local MySQL');
} else {
  console.log('Usage: npx tsx scripts/transfer-db.ts <direction>');
  console.log('  local-to-server  (default)');
  console.log('  server-to-local');
}
