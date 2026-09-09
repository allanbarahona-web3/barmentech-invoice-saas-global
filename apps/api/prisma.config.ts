import { loadEnvironmentFile } from './src/config/load-environment-file';
import { defineConfig, env } from 'prisma/config';

loadEnvironmentFile();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DIRECT_DATABASE_URL'),
    shadowDatabaseUrl: env('SHADOW_DATABASE_URL'),
  },
});
