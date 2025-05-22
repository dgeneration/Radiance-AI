// This script runs the TypeScript migration script using ts-node
import 'dotenv/config';
import { execSync } from 'child_process';

try {
  console.log('Running Standalone Radiance AI database migration...');
  execSync('npx ts-node -r tsconfig-paths/register src/scripts/run-standalone-radiance-migration.ts', { stdio: 'inherit' });
  console.log('Database migration completed');
} catch (error) {
  console.error('Error running database migration:', error instanceof Error ? error.message : 'Unknown error');
}
