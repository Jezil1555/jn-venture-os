// Small CLI helper: prints a bcrypt hash for a given plaintext password.
// Usage: npm run hash -- "SomePassword123"
import bcrypt from 'bcrypt';

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run hash -- "YourPassword"');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
console.log(hash);
