// server.js
// Simple Express server to expose our Google Sheets API

import express from 'express';
import dotenv from 'dotenv';
import { getHotelsData } from './src/lib/sheet.js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const app = express();
const port = process.env.PORT || 3001;

// JSON endpoint for hotels/search
app.get('/api/search', async (req, res) => {
  console.log('>>> /api/search called');
  console.log('  • GOOGLE_SHEET_ID =', process.env.GOOGLE_SHEET_ID);
  console.log('  • Credentials present =', Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS));

  try {
    const hotels = await getHotelsData();
    console.log(`>>> getHotelsData resolved, ${hotels.length} hotels loaded`);
    return res.json({ hotels });
  } catch (err) {
    console.error('❌ Error in /api/search:', err.message);
    console.error(err.stack);
    return res.status(500).json({ error: 'Failed to load hotels data', details: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
