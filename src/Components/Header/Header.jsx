import { MdSearch } from "react-icons/md";
import { HiCalendar, HiMinus, HiPlus } from "react-icons/hi";
import { useRef, useState, useEffect, useContext, useMemo } from "react";
import useOutsideClick from "../../Hooks/useOutsideClick";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { DateRange } from "react-date-range";
import { format } from "date-fns";
import { createSearchParams, useNavigate, useSearchParams } from "react-router-dom";
import { HotelsContext } from "../../Contexts/HotelsContext";

let Initial_Option = {
  adult: 1,
  children: 0,
  room: 1,
};

let Initial_Date = {
  startDate: new Date(),
  endDate: new Date(),
  key: "selection",
};

function Header() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Contexto de hoteles para dropdown de ciudades
  const { hotels } = useContext(HotelsContext);
  const cities = useMemo(
    () => Array.from(new Set(hotels.map(h => h.city))).sort(),
    [hotels]
  );
  const [selectedCity, setSelectedCity] = useState("");

  // Initialize options from URL
  let opts;
  try {
    opts = JSON.parse(searchParams.get("option"));
  } catch {
    opts = null;
  }
  const initOption = opts || Initial_Option;
  const [option, setOption] = useState(initOption);

  const [childrenAges, setChildrenAges] = useState(
    Array.from({ length: initOption.children }, () => 0)
  );
  useEffect(() => {
    setChildrenAges(Array.from({ length: option.children }, () => 0));
  }, [option.children]);

  let dtRaw = null;
  try {
    dtRaw = JSON.parse(searchParams.get("date"));
  } catch {
    dtRaw = null;
  }
  const initDate = dtRaw
    ? {
        startDate: new Date(dtRaw.startDate),
        endDate: new Date(dtRaw.endDate),
        key: "selection",
      }
    : Initial_Date;

  const [date, setDate] = useState(initDate);
  const [openDate, setOpenDate] = useState(false);

  const [openOption, setOpenOption] = useState(false);
  const dateRef = useRef();
  useOutsideClick(dateRef, "dateDropDown", () => setOpenDate(false));
  const optionRef = useRef();
  useOutsideClick(optionRef, "optionDropDown", () => setOpenOption(false));

  const handleChangeOption = (operation, type) => {
    setOption((prev) => ({
      ...prev,
      [type]: operation === "inc" ? prev[type] + 1 : prev[type] - 1,
    }));
  };

  const handleSearch = () => {
    const params = {
      date: JSON.stringify(date),
      option: JSON.stringify(option),
      childrenAges: JSON.stringify(childrenAges),
      city: selectedCity,
    };
    setSearchParams(params);
  };

  return (
    <div className="header flex items-center justify-between w-full px-6 py-4 bg-white shadow">
      {/* Search bar */}
      <div className="header__search flex justify-center items-center w-full max-w-3xl border rounded-xl p-4 bg-white">
        {/* Date picker */}
        <div className="header__search-item" ref={dateRef}>
          <HiCalendar className="search__icon" />
          <div
            className="search__date-dropDown cursor-pointer"
            onClick={() => { setOpenDate(!openDate); setOpenOption(false); }}
          >
            {`${format(date.startDate, "dd/MM/yyyy")} to ${format(
              date.endDate,
              "dd/MM/yyyy"
            )}`}
          </div>
          <div>
            {openDate && (
              <DateRange
                className="date-dropDown"
                ranges={[date]}
                onChange={(item) => setDate(item.selection)}
                minDate={new Date()}
                moveRangeOnFirstSelection
              />
            )}
          </div>
        </div>

        {/* Selector de ciudad */}
        <div className="header__search-item">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="p-2 border rounded bg-white"
          >
            <option value="">All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Guest options */}
        <div className="header__search-item relative" id="optionDropDown" ref={optionRef}>
          <div
            className="search__options-dropDown cursor-pointer"
            onClick={() => { setOpenOption(!openOption); setOpenDate(false); }}
          >
            {option.adult} Adult &bull; {option.children} Children &bull; {option.room} Room
          </div>

          {openOption && (
            <div className="options-dropDown bg-white shadow-lg rounded p-4">
              <GuestOptionItem
                type="Adult"
                option={option}
                minLimit={1}
                onChangeOption={handleChangeOption}
              />
              <GuestOptionItem
                type="Children"
                option={option}
                minLimit={0}
                onChangeOption={handleChangeOption}
              />
              <GuestOptionItem
                type="Room"
                option={option}
                minLimit={1}
                onChangeOption={handleChangeOption}
              />

              {option.children > 0 && (
                <div className="mt-4">
                  <span className="block mb-2 font-medium">Children's Ages</span>
                  {childrenAges.map((age, idx) => (
                    <select
                      key={idx}
                      value={age}
                      onChange={(e) => {
                        const newA = [...childrenAges];
                        newA[idx] = parseInt(e.target.value, 10);
                        setChildrenAges(newA);
                      }}
                      className="p-2 border rounded w-full mb-2"
                    >
                      <option value={0}>0</option>
                      {[...Array(17)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search button */}
        <div className="header__search-item">
          <button
            className="search__btn bg-blue-600 text-white rounded px-4 py-2"
            onClick={handleSearch}
          >
            <MdSearch className="search__icon" />
          </button>
        </div>
      </div>
      {/* Company Logo */}
      <div className="logo ml-6">
        <img src="/logo.jpg" alt="Company Logo" style={{ height: '70px', width: 'auto' }} />
      </div>
    </div>
  );
}

export default Header;

function GuestOptionItem({ type, option, minLimit, onChangeOption }) {
  return (
    <div className="option-item flex justify-between items-center mb-2">
      <span className="option__text capitalize">{type}</span>
      <div className="option__counter flex items-center gap-2">
        <button
          className="option__counter__btn p-1"
          disabled={option[type.toLowerCase()] <= minLimit}
          onClick={() => onChangeOption("dec", type.toLowerCase())}
        >
          <HiMinus />
        </button>
        <span className="font-medium">{option[type.toLowerCase()]}</span>
        <button
          className="option__counter__btn p-1"
          onClick={() => onChangeOption("inc", type.toLowerCase())}
        >
          <HiPlus />
        </button>
      </div>
    </div>
  );
}