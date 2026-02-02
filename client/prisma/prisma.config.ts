// Optional: install dotenv and uncomment to load .env for CLI (migrate, studio, etc.)
// import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
