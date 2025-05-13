// This script runs the TypeScript initialization script using ts-node
import 'dotenv/config';
import { execSync } from 'child_process';

try {
  console.log('Running Chain Diagnosis database initialization...');
  execSync('npx ts-node -r tsconfig-paths/register src/scripts/init-chain-diagnosis-db.ts', { stdio: 'inherit' });
  console.log('Database initialization completed');
} catch (error) {
  console.error('Error running database initialization:', error instanceof Error ? error.message : 'Unknown error');
}
