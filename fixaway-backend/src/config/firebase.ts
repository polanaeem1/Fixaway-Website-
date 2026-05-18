import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Resolve path to the service account key
const serviceAccountPath = path.resolve(__dirname, 'fixaway-firebase-adminsdk.json');

// Ensure Firebase is not initialized more than once
if (!admin.apps.length) {
  try {
    if (fs.existsSync(serviceAccountPath)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin initialized successfully!');
    } else {
      console.warn('Firebase Admin SDK config not found at', serviceAccountPath);
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

export default admin;
