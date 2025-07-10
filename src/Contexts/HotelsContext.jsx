import { createContext, useContext } from "react";
import useFetch from "../Hooks/useFetch";

// Contexto para hoteles
export const HotelsContext = createContext(null);
const Base_URL = "/api/search";

export function HotelsProvider({ children }) {
  // useFetch obtiene { data, isLoading }
  const { data, isLoading } = useFetch(Base_URL);
  // data es el objeto { hotels: [...] }, extraemos el array
  const hotels = data?.hotels || [];

  return (
    <HotelsContext.Provider value={{ hotels, isLoading }}>
      {children}
    </HotelsContext.Provider>
  );
}

export const useHotels = () => {
  const context = useContext(HotelsContext);
  if (context === undefined)
    throw new Error("HotelsContext must be used within HotelsProvider");
  return context;
};
