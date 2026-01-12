import * as admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;

const serviceAccount = {
  "type": "service_account",
  "project_id": "memory-weaver-8rk9t",
  "private_key_id": "4095e6e99ea524fc036067b2967a484c59f9d8d3",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC/En+kQ81GtemF\nV+6rrFwMUM4FuswwhE/v9bzri4+Xwz29U5UsJwPxDjU2VvNOXVRbumz3Sm18ZJ14\ndr1IlWhsaNyrJM3QCpIi8cf1cPqccrK3lEDM4OKP1WEIBapf34qUyJ8sJ7FKVlZK\niRwK5vIuDgd7Q0c8bsGAq18dBNBFErsmfbg7BPAtjKG2MiwXtsxezOkNcoqX55d6\nZLoxgZTZ+shb09/0s/XpmjsaNDh2PHIKwxKvjUbw0dB03Dc9siZ/mefwcwwpgQGD\ntwdOFpsRYRtqw1e0AyM+iOkQzGchJAlUTrCRFMxisPX3Pd94DUQyU14jHbbgV9OK\nKy+WTyX3AgMBAAECggEAC2NM3Dt2Rpqc+meNQAobylgej1Tcyp94LDMXOWqt+juW\nuGv83g7NO1a/cSephKgnWPg5elujPuC4Se+5xFOzT5LIZCLjaVzX7OFAK666IQzs\n/egGHK/ikPQEvnen+eLW3Zs/cWBEPsv6hKK7WyL8mCYZ6AzQeBeZzNNp7c7Vougq\nfB1+15wYOhuqwimqwrPaFQu2b2aAmfirW8HpS/lnATtZxfNz8SWFRWU2t6WVYEf/\nk1gHrK4gd1legNprIjUS7ObjiMLbZWjOqUox7UV97CorrT67mnOuJgS87EAfTItg\n2ZKLx5yoSHTf5s5mUG/+OZzhZBbg/5Jr4k3vt8b+oQKBgQDpqdeAv+Ca10aORU3N\nQh8hGSnU2UEDeTc+vZySxAQorNQ78QnekJJq6oIophDYnayApQu3R5rQ+Wp0L2xi\nlGn1OU3uIZkqB83gZyocylAaluWwjN+9cjBBkcJEO6vaClU4zg6eTHhzkqVkwOOo\nSGqdLcLMeioqCTUMolsUUteIGQKBgQDRVmAGpYzyOhkwjU8CZgC+e2S3+z4+E7nU\nDlyZWBP4Qn5Odj5pbf9NuM2cbMcoaGYBscTKpZFi3O+xlwoc+gOQLap0yMu3Ycji\nUVHZo+2d3OrYnoznH6iiYgCFC9mqidogjV5DJpCOe4204xi7p0qnb9jcDNEixExd\neCTp/v8gjwKBgQCDRB/Fu4VhV0jSygpAIkI8pNdENNx6KBGqFHkuViID+7urBOlH\neC5ZE+8VCN3z4vgyuQWQ7BAED+oG5VFdPAUedxfZjFRwMTwuMaaNz/YaSeU1Pp6+\n3bRQUaMyE9eiQSXJKLE7qrgMLTjvFhGOy0fhjwCdQJAJV2zO8TJ7g2KDmQKBgQCF\nZuni0nUzl9qdmi+Tc7VdrfzNUgqkPKXbgRt5jSuMtbMQBUJYpYRg3zgISznPglgf\nFE44ZbJ0sh79qScEuD61DqTlr2BDCMmfj/r9Gv49756pVMCuOPqaIKH8J0Ua7KZY\nwD4lxNmyMwJnF6GXVFC6ywgDkxdjdHzFw96iT6H9+QKBgQCIjw5NIaTcIaQrPPNU\ntJQwKEBT6J7G1Ur1DqbWTld8uf2o38oqSQBco9rm9PsAjvU+RBulGDuFn1BZz0L7\nLxFoNuNifzgpnj/pqhW6wTu6Y9Vy9EWkmzV0KeIij7XBXVAEZQfjdqGvX10HQgMA\n5HqM32/wNhME8N1gZDoYVvmrig==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@memory-weaver-8rk9t.iam.gserviceaccount.com",
  "client_id": "105850255169459264510",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40memory-weaver-8rk9t.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'memory-weaver-8rk9t.appspot.com'
    });
    console.log('[firebase-admin] Admin SDK initialized successfully with hardcoded service account.');
  } catch (error: any) {
    console.error('[firebase-admin] CRITICAL: Firebase Admin initialization failed:', error);
  }
}

if (admin.apps.length > 0 && admin.apps[0]) {
    adminDb = admin.firestore();
    adminAuth = admin.auth();
} else {
    console.error('[firebase-admin] Admin SDK not initialized. Firebase server-side calls will fail.');
}

export { adminDb, adminAuth };
