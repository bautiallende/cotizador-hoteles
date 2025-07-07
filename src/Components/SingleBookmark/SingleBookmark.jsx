import { Link, useNavigate, useParams } from "react-router-dom";
import { useBookmarks } from "../../Contexts/BookmarksContext";
import { useEffect, useState } from "react";
import Loader from "../Loader/Loader";
import { HiChevronDoubleLeft } from "react-icons/hi";
import { useHotels } from "../../Contexts/HotelsContext";

export default function SingleBookmark() {
  const { id } = useParams();
  const { currentBookmark, getSingleBookmark, isLoading } = useBookmarks();
  const { hotels } = useHotels();
  const navigate = useNavigate();
  const [filteredHotels, setFilteredHotels] = useState([]);

  useEffect(() => {
    getSingleBookmark(id);
  }, [id]);

  useEffect(() => {
    if (currentBookmark && hotels) {
      const list = hotels.filter(
        (item) => item.country === currentBookmark.country
      );
      setFilteredHotels(list);
    }
  }, [currentBookmark, hotels]);

  if (isLoading) return <Loader />;

  return (
    <div className="p-4">
      <button
        className="btn btn--back mb-4"
        onClick={() => navigate(-1)}
      >
        <HiChevronDoubleLeft /> Back
      </button>

      <h2 className="text-2xl font-semibold mb-2">
        {currentBookmark.cityName}
      </h2>
      <span className="text-gray-600 mb-4 block">
        {currentBookmark.country}
      </span>

      <div className="bookmarks-list space-y-2">
        {filteredHotels.length === 0 ? (
          <span className="text-center font-bold text-gray-500 mt-8 block">
            No hotels found for this country.
          </span>
        ) : (
          filteredHotels.map((item) => (
            <Link
              key={item.hotelId}
              to={`/hotels/${item.hotelId}`}
              className="block p-4 border rounded hover:bg-gray-50"
            >
              <div className="text-lg font-medium">{item.hotelId}</div>
              {item.rooms && item.rooms.length > 0 && (
                <div className="text-sm text-gray-600">
                  {item.rooms[0].category} - {item.rooms[0].roomCode}
                </div>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
