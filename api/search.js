import { getHotelsData } from '../src/lib/sheets.js';

export default async function handler(req, res) {
  try {
    // Parse query params
    const { date, option, childrenAges } = req.query;
    // date: { startDate, endDate }
    const { startDate, endDate } = JSON.parse(date || '{}');
    const { adult, children, room } = JSON.parse(option || '{}');
    const ages = JSON.parse(childrenAges || '[]');

    // Fetch and structure data
    const hotels = await getHotelsData();

    // Respond with raw data or implement filtering here
    // (You can re-use your frontend filtering logic server-side if preferred)
    res.status(200).json({ hotels });
  } catch (error) {
    console.error('API /search error:', error);
    res.status(500).json({ error: error.message });
  }
}
