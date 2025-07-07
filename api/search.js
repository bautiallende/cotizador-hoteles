import { getHotelsData } from '../src/lib/sheet.js';

export default async function handler(req, res) {
  try {
    const hotels = await getHotelsData();
    res.status(200).json({ hotels });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}