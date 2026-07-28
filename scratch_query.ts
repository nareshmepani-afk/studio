import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

const config = JSON.parse(fs.readFileSync('C:\\Users\\home\\.config\\configstore\\firebase-tools.json', 'utf8'));
const token = config.tokens.access_token;

async function main() {
  try {
    const app = getApps().length === 0 ? initializeApp({ projectId: 'memory-weaver-dev' }) : getApps()[0];
    const db = getFirestore(app);

    console.log("Querying Firestore using REST with OAuth token...");
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
