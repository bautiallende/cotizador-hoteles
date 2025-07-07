// src/lib/sheets.js
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

let sheetsClient;

// Inicializa cliente de Google Sheets 
async function initSheets() {
  if (sheetsClient) return sheetsClient;
  const credsEnv = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
  if (!credsEnv) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_CREDENTIALS env var');
  let creds;
  try {
    creds = credsEnv.trim().startsWith('{')
      ? JSON.parse(credsEnv)
      : JSON.parse(fs.readFileSync(
          path.isAbsolute(credsEnv) ? credsEnv : path.resolve(process.cwd(), credsEnv),
          'utf8'
        ));
  } catch (err) {
    throw new Error('Failed to parse credentials: ' + err.message);
  }

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const client = await auth.getClient();
  sheetsClient = google.sheets({ version: 'v4', auth: client });
  return sheetsClient;
}

// Obtiene valores de una hoja
async function getSheetValues(sheetName) {
  const client = await initSheets();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const res = await client.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:Z1000`,
  });
  return res.data.values;
}

// Parsea filas de sheet basado en cabeceras mapeadas
function parseRows(values, headersMap) {
  const [headerRow, ...rows] = values;
  return rows.map(row => {
    const obj = {};
    headerRow.forEach((h, i) => {
      const key = headersMap[h] || h;
      obj[key] = row[i] ?? '';
    });
    return obj;
  });
}

// Parsea cadenas de fecha en DD/MM/YYYY, DD-MM-YYYY o ISO YYYY-MM-DD
function parseDateString(str) {
  if (!str) return null;
  const parts = str.split(/[-\/]/);
  // Si es formato ISO YYYY-MM-DD
  if (parts.length === 3 && parts[0].length === 4) {
    const d = new Date(str);
    return isNaN(d) ? null : d;
  }
  // Si es DD-MM-YYYY o DD/MM/YYYY
  if (parts.length === 3) {
    const [day, month, year] = parts.map(p => parseInt(p, 10));
    const d = new Date(year, month - 1, day);
    return isNaN(d) ? null : d;
  }
  // Fallback a Date
  const d = new Date(str);
  return isNaN(d) ? null : d;
}

// Lee y normaliza reglas de precio
export async function getPriceRules() {
  const values = await getSheetValues('PriceRules');
  const rows = parseRows(values, {
    hotel_id: 'hotelId',
    category: 'category',
    room_code: 'roomCode',
    adults: 'adults',
    children: 'children',
    child_age_ranges: 'childAgeRanges',
    start_date: 'startDate',
    end_date: 'endDate',
    base_price: 'basePrice',
  });

  const rules = rows
    .map(r => {
      const startDate = parseDateString(r.startDate);
      const endDate   = parseDateString(r.endDate);
      const basePrice = parseFloat(r.basePrice.replace(/[^0-9.,-]/g, '').replace(',', '.'));
      return { hotelId: r.hotelId, category: r.category, roomCode: r.roomCode,
               capacity: { adults: parseInt(r.adults, 10), children: parseInt(r.children, 10), childAgeRanges: r.childAgeRanges.split(';').map(s=>s.trim()) },
               startDate, endDate, basePrice };
    })
    .filter(r => r.startDate && r.endDate && typeof r.basePrice === 'number' && !isNaN(r.basePrice));

  console.log('Loaded valid PriceRules:', rules);
  return rules;
}

// Lee y normaliza reglas de descuento
export async function getDiscounts() {
  const values = await getSheetValues('Discounts');
  const rows = parseRows(values, {
    hotel_id: 'hotelId',
    cutoff_date: 'cutoffDate',
    period_start: 'periodStart',
    period_end: 'periodEnd',
    discount_pct: 'discountPct',  
  });

  console.log('Loaded Discounts:', rows);

  return rows.map(r => ({
    hotelId: r.hotelId,
    cutoffDate: parseDateString(r.cutoffDate),
    periodStart: parseDateString(r.periodStart),
    periodEnd: parseDateString(r.periodEnd),
    discountPct: parseFloat(r.discountPct),
  }));
}

// Combina reglas por hotel
export async function getHotelsData() {
  const priceRules = await getPriceRules();
  const discountRules = await getDiscounts();
  const map = {};
  for (const pr of priceRules) {
    const { hotelId, roomCode, category, capacity, startDate, endDate, basePrice } = pr;
    if (!map[hotelId]) map[hotelId] = { hotelId, roomsMap: {}, discounts: [] };
    map[hotelId].discounts = discountRules.filter(d => d.hotelId === hotelId);
    const key = `${roomCode}|${category}`;
    if (!map[hotelId].roomsMap[key]) {
      map[hotelId].roomsMap[key] = { roomCode, category, capacity, priceRules: [] };
    }
    map[hotelId].roomsMap[key].priceRules.push({ startDate, endDate, basePrice });
  }
  return Object.values(map).map(h => ({ hotelId: h.hotelId, rooms: Object.values(h.roomsMap), discounts: h.discounts }));
}
