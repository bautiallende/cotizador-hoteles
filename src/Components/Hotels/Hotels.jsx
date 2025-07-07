import React from 'react';
import ResultsTable from "../ResultsTable/ResultsTable";
import Loader from "../Loader/Loader";
import { useHotels } from "../../Contexts/HotelsContext";

/**
 * Main Hotels component renders a loader or the results table
 */
export default function Hotels() {
  const { hotels, isLoading } = useHotels();

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="search-results p-4">
      <h2 className="text-lg font-semibold mb-4">
        Search Results: ({hotels?.length ?? 0})
      </h2>
      <ResultsTable data={hotels} />
    </div>
  );
}
