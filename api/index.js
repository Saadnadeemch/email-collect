const express = require('express');
const admin = require('firebase-admin');

const app = express();
app.use(express.json());

// ── Firebase init (prevent multiple inits in serverless) ──
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// ── Routes ─────────────────────────────────────────────

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'Buckty backend is running 🚀' });
});

// Subscribe endpoint
app.post('/subscribe', async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();

    const existing = await db
      .collection('waitlist')
      .where('email', '==', cleanEmail)
      .get();

    if (!existing.empty) {
      return res.status(200).json({
        success: true,
        message: 'Already on the list!',
      });
    }

    await db.collection('waitlist').add({
      email: cleanEmail,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      message: 'Successfully subscribed!',
    });

  } catch (err) {
    console.error('Firestore error:', err);
    return res.status(500).json({
      error: 'Something went wrong. Please try again.',
    });
  }
});

// ✅ IMPORTANT: Export for Vercel
module.exports = app;