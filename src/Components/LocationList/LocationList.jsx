import React from "react";
import Loader from "../Loader/Loader";
import { useSearchParams } from "react-router-dom";
import { useHotels } from "../../Contexts/HotelsContext";
import ResultsTable from "../ResultsTable/ResultsTable";

/**
 * LocationList muestra los resultados de búsqueda o el loader.
 * Si no hay filtros aplicados, muestra un mensaje inicial invitando a buscar.
 */
export default function LocationList() {
  const [searchParams] = useSearchParams();
  const { hotels, isLoading } = useHotels();

  // Validar existencia de filtros
  const hasDate = Boolean(searchParams.get("date"));
  const hasOption = Boolean(searchParams.get("option"));

  // Si no hay filtros, mostrar mensaje de bienvenida
  if (!hasDate || !hasOption) {
    return (
      <div className="welcome-wrapper">
        <div className="welcome-box">
          <h2>Start Your Search</h2>
          <p>
            Please select your travel dates, number of guests, and rooms
            using the search bar above to view available accommodations.
          </p>
        </div>
      </div>
    );
  }

  // Extraer y parsear parámetros de búsqueda
  const dateParam = JSON.parse(searchParams.get("date") || "{}");
  const checkIn = dateParam.startDate ? new Date(dateParam.startDate) : null;
  const checkOut = dateParam.endDate ? new Date(dateParam.endDate) : null;

  const optionParam = JSON.parse(searchParams.get("option") || "{}");
  const adults = optionParam.adult || 1;
  const children = optionParam.children || 0;
  const roomsCount = optionParam.room || 1;

  const childrenAges = JSON.parse(searchParams.get("childrenAges") || "[]");

  return (
    <div className="search-results p-4">
      <h2 className="text-lg font-semibold mb-4">
        {/* Search Results: ({hotels.length}) */}
      </h2>
      {isLoading ? (
        <Loader />
      ) : (
        <ResultsTable
          data={hotels}
          checkIn={checkIn}
          checkOut={checkOut}
          adults={adults}
          children={children}
          childrenAges={childrenAges}
          roomsCount={roomsCount}
        />
      )}
    </div>
  );
}
