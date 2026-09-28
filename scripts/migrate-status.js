// MW-186: One-off status migration script
// Sets status: 'pre-release' for memory ey96djU6qR1BrDGnvZwp
// Uses the same Admin SDK as the deployed app

const admin = require('firebase-admin');
const path = require('path');

// Load service account from the project's service-account key
const serviceAccountPath = path.resolve(__dirname, '..', 'service-account-key.json');

try {
  const serviceAccount = require(serviceAccountPath);
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const db = admin.firestore();
  const memoryRef = db.doc('users/TQdB395kXxaAGPhFxk1LVWuT8cg2/memories/ey96djU6qR1BrDGnvZwp');

  async function migrate() {
    const doc = await memoryRef.get();
    if (!doc.exists) {
      console.error('Document not found!');
      process.exit(1);
    }

    const data = doc.data();
    console.log('BEFORE:', { status: data.status, title: data.title, promptId: data.promptId });

    if (data.status === 'draft') {
      await memoryRef.update({ status: 'pre-release' });
      console.log('AFTER: status updated to pre-release');
    } else {
      console.log('Status is already:', data.status, '— no change needed');
    }

    // Verify
    const verify = await memoryRef.get();
    console.log('VERIFIED:', { status: verify.data().status });
    process.exit(0);
  }

  migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });

} catch (e) {
  console.error('Failed to load service account:', e.message);
  console.log('Make sure service-account-key.json exists in the project root');
  process.exit(1);
}
