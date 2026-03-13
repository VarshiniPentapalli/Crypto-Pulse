import { useState, useEffect, useRef } from "react";
import { fetchCryptos, addCrypto } from "../services/api";
import CryptoCard from "../components/CryptoCard";
import { useNavigate } from "react-router-dom";
import coinList from "../data/coins.json";
import { RiLogoutBoxLine } from "react-icons/ri";

export default function Dashboard() {
  const navigate = useNavigate();

  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showPopup, setShowPopup] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isAdding, setIsAdding] = useState(false);

  const popupRef = useRef();
  const searchInputRef = useRef();

  /* ================= CHECK TOKEN ================= */

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  /* ================= FETCH USER CRYPTOS ================= */

  useEffect(() => {
    const getCryptos = async () => {
      setLoading(true);

      try {
        const res = await fetchCryptos();
        setCryptos(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch crypto data");
      }

      setLoading(false);
    };

    getCryptos();
  }, []);

  /* ================= SEARCH FILTER ================= */

  useEffect(() => {
    if (searchInput.length > 0) {
      const filtered = coinList.filter((coin) =>
        coin.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchInput.toLowerCase()) ||
        coin.id.toLowerCase().includes(searchInput.toLowerCase())
      );

      setSuggestions(filtered.slice(0, 10));
    } else {
      setSuggestions([]);
    }
  }, [searchInput]);

  /* ================= CLOSE POPUP ON OUTSIDE CLICK ================= */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        closePopup();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ================= ADD CRYPTO ================= */

  const handleAddCrypto = async (coinId) => {

    const cryptoId = coinId || searchInput.trim().toLowerCase();

    if (!cryptoId) {
      setError("Please enter or select a cryptocurrency");
      return;
    }

    setIsAdding(true);
    setError("");

    try {

      const result = await addCrypto(cryptoId);

      if (result.success) {

        const res = await fetchCryptos();
        setCryptos(res.data);

        closePopup();

      } else {

        throw new Error(result.message || "Failed to add cryptocurrency");

      }

    } catch (err) {

      setError(err.response?.data?.message || err.message);

    } finally {

      setIsAdding(false);

    }
  };

  /* ================= ENTER KEY ================= */

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCrypto();
    }
  };

  /* ================= CLOSE POPUP ================= */

  const closePopup = () => {
    setShowPopup(false);
    setSearchInput("");
    setSuggestions([]);
    setError("");
  };

  /* ================= LOGOUT ================= */

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <header className="flex justify-between items-center mb-8">

          <div>
            <h1 className="text-3xl font-bold text-white">
              Crypto Dashboard
            </h1>

            <p className="text-gray-400">
              Track your favorite ❤️ cryptocurrencies
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            <RiLogoutBoxLine className="inline-block text-xl"/> Logout
          </button>

        </header>

        {/* LOADING */}

        {loading && (
          <div className="text-center py-12 text-white">
            Loading your cryptocurrencies...
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="bg-red-900 text-red-100 p-4 mb-4 rounded">
            {error}
          </div>
        )}

        {/* CRYPTO GRID */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

          {cryptos.map((crypto) => (

            <CryptoCard
              key={crypto.id}
              crypto={crypto}
              onDelete={(deletedId) => {
                setCryptos(prev => prev.filter(c => c.id !== deletedId));
              }}
            />

          ))}

          {/* ADD CARD */}

          <div
            className="bg-gray-700 hover:bg-gray-600 cursor-pointer flex items-center justify-center rounded-xl h-48"
            onClick={() => {
              setShowPopup(true);
              setTimeout(() => searchInputRef.current?.focus(), 100);
            }}
          >
            <span className="text-white text-4xl">+</span>
          </div>

        </div>

        {/* ADD POPUP */}

        {showPopup && (

          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">

            <div
              ref={popupRef}
              className="bg-gray-800 rounded-xl p-6 w-80"
            >

              <h3 className="text-lg font-bold mb-4 text-white">
                Add Cryptocurrency
              </h3>

              <input
                ref={searchInputRef}
                type="text"
                placeholder="bitcoin, btc, ethereum..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full border border-gray-600 bg-gray-700 text-white rounded px-3 py-2 mb-4"
              />

              {suggestions.length > 0 && (

                <ul className="max-h-40 overflow-y-auto space-y-2 mb-4">

                  {suggestions.map((coin) => (

                    <li
                      key={coin.id}
                      onClick={() => handleAddCrypto(coin.id)}
                      className="cursor-pointer p-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
                    >

                      {coin.name} ({coin.symbol.toUpperCase()})

                    </li>

                  ))}

                </ul>

              )}

              <button
                onClick={() => handleAddCrypto()}
                disabled={isAdding}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >

                {isAdding ? "Adding..." : "Add Crypto"}

              </button>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}