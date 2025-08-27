// import { drizzle } from 'drizzle-orm/node-postgres';

// const DATABASE_URL = process.env.DATABASE_URL
// const db = drizzle(DATABASE_URL!);

// export default db;


import { drizzle } from "drizzle-orm/node-postgres";
import { reports, users, scans } from "./schema"; // ✅ import all tables
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

 const db = drizzle(pool, {
  schema: { reports, users, scans }, // ✅ schema must include reports
});

export default db;