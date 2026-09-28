/**
 * Migration Script: Director's Notepad
 * Moves 'directorsNotepad' field to 'analysis/notepad' subdocument.
 */

const admin = require('firebase-admin');

const fs = require('fs');
const path = require('path');

// Manually parse .env.local to get SERVICE_ACCOUNT_JSON
const envPath = path.join(process.cwd(), '.env.local');
let serviceAccountRaw = process.env.SERVICE_ACCOUNT_JSON;

if (!serviceAccountRaw && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/SERVICE_ACCOUNT_JSON=['"]?({[\s\S]*?})['"]?\s*$/m);
  if (match) {
    serviceAccountRaw = match[1];
  }
}

if (!serviceAccountRaw) {
  console.error("SERVICE_ACCOUNT_JSON missing from environment and .env.local");
  process.exit(1);
}

const cleanJson = serviceAccountRaw.trim().replace(/^['"]|['"]$/g, '');
const credentials = JSON.parse(cleanJson);
if (credentials.private_key) {
  credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
}

let storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
if (!storageBucket && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=(.*)$/m);
  if (match) {
    storageBucket = match[1].trim().replace(/^['"]|['"]$/g, '');
  }
}

admin.initializeApp({
  credential: admin.credential.cert(credentials),
  storageBucket: storageBucket
});

const db = admin.firestore();

async function migrate() {
  console.log("Starting migration...");
  const usersSnapshot = await db.collection('users').get();
  
  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    console.log(`Checking user: ${userId}`);
    
    const memoriesSnapshot = await db.collection('users').doc(userId).collection('memories').get();
    
    for (const memoryDoc of memoriesSnapshot.docs) {
      const memoryData = memoryDoc.data();
      const memoryId = memoryDoc.id;
      
      if (memoryData.directorsNotepad) {
        console.log(`  Migrating memory: ${memoryId}`);
        
        const notepadData = memoryData.directorsNotepad;
        const analysisRef = db.collection('users').doc(userId).collection('memories').doc(memoryId).collection('analysis').doc('notepad');
        
        await analysisRef.set({
          ...notepadData,
          status: 'completed',
          updatedAt: new Date().toISOString()
        });
        
        await memoryDoc.ref.update({
          directorsNotepad: admin.firestore.FieldValue.delete()
        });
        
        console.log(`    Done.`);
      }
    }
  }
  
  console.log("Migration complete.");
}

migrate().catch(console.error);
