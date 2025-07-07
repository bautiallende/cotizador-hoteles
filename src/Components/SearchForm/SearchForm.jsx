import { useState, useEffect } from "react";

export default function SearchForm({ onSearch }) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [childrenAges, setChildrenAges] = useState([]);

  // Cuando cambie el número de niños, regeneramos el array de edades
  useEffect(() => {
    setChildrenAges(Array.from({ length: children }, () => 0));
  }, [children]);

  const handleSubmit = e => {
    e.preventDefault();
    onSearch({ checkIn, checkOut, adults, children, childrenAges, rooms });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow">
      {/* Fechas */}
      <div className="flex gap-4">
        <div>
          <label className="block">Check‑in</label>
          <input
            type="date"
            value={checkIn}
            onChange={e => setCheckIn(e.target.value)}
            required
            className="border p-2 rounded"
          />
        </div>
        <div>
          <label className="block">Check‑out</label>
          <input
            type="date"
            value={checkOut}
            onChange={e => setCheckOut(e.target.value)}
            required
            className="border p-2 rounded"
          />
        </div>
      </div>

      {/* Adultos, Niños y Habitaciones */}
      <div className="flex gap-4">
        <div>
          <label className="block">Adultos</label>
          <input
            type="number"
            min={1}
            value={adults}
            onChange={e => setAdults(parseInt(e.target.value, 10))}
            className="border p-2 rounded w-20"
          />
        </div>
        <div>
          <label className="block">Niños</label>
          <input
            type="number"
            min={0}
            value={children}
            onChange={e => setChildren(parseInt(e.target.value, 10))}
            className="border p-2 rounded w-20"
          />
        </div>
        <div>
          <label className="block">Habitaciones</label>
          <input
            type="number"
            min={1}
            value={rooms}
            onChange={e => setRooms(parseInt(e.target.value, 10))}
            className="border p-2 rounded w-20"
          />
        </div>
      </div>

      {/* Si hay niños, desplegar select de edades */}
      {children > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <p className="col-span-2 font-medium">Edades de los menores</p>
          {childrenAges.map((age, idx) => (
            <select
              key={idx}
              value={age}
              onChange={e => {
                const newAges = [...childrenAges];
                newAges[idx] = parseInt(e.target.value, 10);
                setChildrenAges(newAges);
              }}
              className="border p-2 rounded"
            >
              <option value={0}>0</option>
              {[...Array(17)].map((_, i) => (
                <option key={i+1} value={i+1}>{i+1}</option>
              ))}
            </select>
          ))}
        </div>
      )}

      <button
        type="submit"
        className="mt-4 w-full py-2 bg-blue-600 text-white rounded"
      >
        Buscar
      </button>