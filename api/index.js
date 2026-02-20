const express = require('express');
const admin   = require('firebase-admin');

const app = express();
app.use(express.json());

// ── Firebase init ──────────────────────────────────────────────
admin.initializeApp({
  credential: admin.credential.cert({
    projectId:    process.env.FIREBASE_PROJECT_ID,
    clientEmail:  process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:   process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

// ── Routes ─────────────────────────────────────────────────────

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Buckty backend is running.' });
});

// Subscribe endpoint
app.post('/subscribe', async (req, res) => {
  const { email } = req.body;

  // Basic validation
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  try {
    // Check if email already exists
    const existing = await db
      .collection('waitlist')
      .where('email', '==', email.toLowerCase().trim())
      .get();

    if (!existing.empty) {
      return res.status(200).json({ success: true, message: 'Already on the list!' });
    }

    // Save to Firestore
    await db.collection('waitlist').add({
      email:     email.toLowerCase().trim(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ success: true, message: 'Successfully subscribed!' });

  } catch (err) {
    console.error('Firestore error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ── Start server (for local dev) ───────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;