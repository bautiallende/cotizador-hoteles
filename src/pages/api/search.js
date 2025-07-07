import { getHotelsData } from '../../lib/sheets';

/**
 * API Route: /api/search
 * Returns the full catalog of hotels with rooms, priceRules and discounts.
 * Future: can accept query params (checkIn, checkOut, adults, children, childrenAges, rooms)
 */
export default async function handler(req, res) {
  console.log('🔍 /api/search called, query=', req.query);
  try {
    const hotels = await getHotelsData();
    console.log(`🛎  Loaded ${hotels.length} hotels`);
    return res.status(200).json({ hotels });
  } catch (error) {
    console.error('❌ Error in /api/search:', error);
    return res.status(500).json({ error: 'Failed to load hotels data' });
  }
}
