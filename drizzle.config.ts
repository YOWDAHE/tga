import { defineConfig } from 'drizzle-kit';
import './envConfig.ts';

// console.log("Database URL: ", process.env.DATABASE_URL);

export default defineConfig({
    out: './backend/drizzle',
    schema: './backend/src/db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
