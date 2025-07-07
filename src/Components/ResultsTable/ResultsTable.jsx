import React from 'react';

/**
 * ResultsTable Component
 * @param {{ data: Array, checkIn: Date, checkOut: Date, adults: number, children: number, childrenAges: number[], roomsCount: number }} props
 */
export default function ResultsTable({ data, checkIn, checkOut, adults, children, childrenAges, roomsCount }) {
  const searchDate = new Date();
  const formatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

  // 1) Normalize hotel data
  const hotels = data.map(hotel => ({
    ...hotel,
    rooms: hotel.rooms.map(room => ({
      ...room,
      priceRules: room.priceRules.map(pr => ({
        ...pr,
        startDate: new Date(pr.startDate),
        endDate:   new Date(pr.endDate),
      })),
    })),
    discounts: (hotel.discounts || []).map(d => ({
      ...d,
      cutoffDate:  new Date(d.cutoffDate),
      periodStart: new Date(d.periodStart),
      periodEnd:   new Date(d.periodEnd),
    })),
  }));

  // 2) Generate nights between checkIn and checkOut
  const getNightDates = (start, end) => {
    const dates = [];
    let cur = new Date(start);
    while (cur < end) {
      dates.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  };
  const nightDates = checkIn && checkOut ? getNightDates(checkIn, checkOut) : [];

  // 3) Base price per night
  const getBasePrice = (rules, night) => {
    const exact = rules.find(r => night >= r.startDate && night <= r.endDate);
    if (exact) return exact.basePrice;
    const sorted = [...rules].sort((a, b) => a.startDate - b.startDate);
    const next = sorted.find(r => night < r.startDate);
    return next ? next.basePrice : (sorted[sorted.length - 1]?.basePrice || 0);
  };

  // 4) Discount percent per night
  const getDiscountPct = (discounts, night) => {
    let pct = 0;
    discounts.forEach(d => {
      if (searchDate <= d.cutoffDate && night >= d.periodStart && night <= d.periodEnd) {
        pct = d.discountPct;
      }
    });
    return pct;
  };

  // Helper: match children ages to ranges
  const matchChildrenToRanges = (ages, ranges) => {
    const sortedAges = [...ages].sort((a, b) => b - a);
    const sortedRanges = ranges
      .map(r => ({ min: r.min, max: r.max }))
      .sort((a, b) => a.max - b.max);
    for (let age of sortedAges) {
      const idx = sortedRanges.findIndex(r => age >= r.min && age <= r.max);
      if (idx === -1) return false;
      sortedRanges.splice(idx, 1);
    }
    return true;
  };

  const requiredAdultsPerRoom = Math.ceil(adults / roomsCount);

  // 5) Filter hotels and rooms
  const filteredHotels = hotels
    .map(hotel => {
      const validRooms = hotel.rooms.filter(room => {
        const { adults: capAdults, children: capChildren, childAgeRanges } = room.capacity;
        // Price coverage
        if (!nightDates.every(n => room.priceRules.some(r => n >= r.startDate && n <= r.endDate))) {
          return false;
        }
        // No children selected
        if (children === 0) {
          return capChildren === 0 && capAdults >= requiredAdultsPerRoom;
        }
        // Children selected, adult-only fallback
        if (capChildren === 0) {
          return capAdults >= (adults + children);
        }
        // Parse and evaluate children ages
        const ranges = childAgeRanges
          .map(str => {
            const [minStr, maxStr] = str.split(/[-–]/).map(s => s.trim());
            return { min: parseFloat(minStr), max: parseFloat(maxStr) };
          })
          .filter(r => !isNaN(r.min) && !isNaN(r.max));
        if (ranges.length === 0) return false;
        // Count fit and non-fit children
        let fitCount = 0;
        let nonFitCount = 0;
        childrenAges.forEach(age => {
          if (ranges.some(r => age >= r.min && age <= r.max)) fitCount++;
          else nonFitCount++;
        });
        // Child slots must match fitCount
        if (capChildren > 0 && capChildren !== fitCount) return false;
        // Adult slots must cover adults + nonFitCount
        if (capAdults < adults + nonFitCount) return false;
        return true;
      });
      return { ...hotel, rooms: validRooms };
    })
    .filter(h => h.rooms.length > 0);

  // 6) No results view
  if (filteredHotels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="welcome-wrapper">
          <div className="welcome-box">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">No Results Found</h2>
            <p className="text-gray-600">
              Apologies, we couldn’t find any rooms matching your filters.<br/>
              Please refine your search criteria and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 7) Render results table
  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full bg-white shadow rounded-lg mx-auto">
        <thead className="bg-gray-100 sticky top-0 z-10">
          <tr>
            <th className="px-6 py-3 text-left uppercase">Hotel</th>
            <th className="px-6 py-3 text-left uppercase">Category</th>
            <th className="px-6 py-3 text-left uppercase">Room Type</th>
            <th className="px-6 py-3 text-center uppercase">N° Rooms</th>
            <th className="px-6 py-3 text-right uppercase">Total Price</th>
          </tr>
        </thead>
        <tbody>
          {filteredHotels.map((hotel, hi) => {
            const groups = hotel.rooms.reduce((acc, room) => {
              (acc[room.category] = acc[room.category] || []).push(room);
              return acc;
            }, {});
            return Object.entries(groups).flatMap(([category, rooms], gi) =>
              rooms.map((room, ri) => {
                const nightlySum = nightDates.reduce((sum, night) => {
                  const base = getBasePrice(room.priceRules, night);
                  const pct = getDiscountPct(hotel.discounts, night);
                  return sum + base * (1 - pct / 100);
                }, 0);
                const totalPrice = nightlySum * roomsCount;
                const key = `${hotel.hotelId}-${category}-${room.roomCode}-${hi}-${gi}-${ri}`;
                return (
                  <tr key={key} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {ri === 0 && <td rowSpan={rooms.length} className="px-6 py-4 text-sm font-medium text-gray-900">{hotel.hotelName || hotel.hotelId}</td>}
                    {ri === 0 && <td rowSpan={rooms.length} className="px-6 py-4 text-sm text-gray-700">{category}</td>}
                    <td className="px-6 py-4 text-sm text-gray-700">{room.roomCode}</td>
                    <td className="px-6 py-4 text-sm text-center text-gray-900">{roomsCount}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">{formatter.format(totalPrice.toFixed(2))}</td>
                  </tr>
                );
              })
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
