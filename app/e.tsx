"use client";

import { useEffect, useState } from "react";

const scannerIds = [
  "CALEB",
  "TAKUR",
  "ELATRICK",
  "NAHOM-FONTI",
  "RACHE",
  "MISS-LIYU",
  "NEBA4KILO",
  "TSEGAYE",
  "MASTER-ABENET",
  "MUSSE-SOLOMON-NEWS",
  "BROOK-NEWS",
  "SIMION-DEREJE",
  "BIRUK-ZITTY",
  "ESHETU-MELESE",
  "BERTEMIOS",
  "JR-COUPLE",
  "HLINA-AYALEW",
  "KIRUBEE-AND-BETTY",
  "ABEL",
  "SIKET-NEGUS",
  "B-BOY-TOMMY",
  "EDOMINA",
];

export default function TiktokDashboard() {
  const [name, setName] = useState("");
  const [storedName, setStoredName] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalScans, setTotalScans] = useState(null);
  const [totalTicket, settotalTicket] = useState(null);

  const [error, setError] = useState("");

  const fetchScans = async (nameParam) => {
    setLoading(true);
    try {
      const response = await fetch(
        https://yyjfecgkn3p2y2jldnvrnwqqq40fcmth.lambda-url.us-east-1.on.aws/api/v2/user/registeredByCount/${nameParam}
      );
      const json = await response.json();
      if (json.status === "SUCCESS") {
        setTotalScans(json.data.totalUsers);
        settotalTicket(json.data.totalTickets);
      } else {
        setTotalScans("Error fetching data");
      }
    } catch (err) {
      console.error(err);
      setTotalScans("API Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("tiktokerName");
    if (saved) {
      setStoredName(saved);
      fetchScans(saved);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim().toUpperCase();
    if (!trimmed) return setError("Please enter a name.");
    if (!scannerIds.includes(trimmed))
      return setError("Not eligible. Please contact admin.");

    localStorage.setItem("tiktokerName", trimmed);
    setStoredName(trimmed);
    setError("");
    fetchScans(trimmed);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full bg-[#1A1A1A] rounded-2xl shadow-xl p-8 space-y-6 border border-gray-700">
        <div className="flex flex-col items-center space-y-4">
          <img
            src="https://cdn.worldvectorlogo.com/logos/tiktok-banner-black-3.svg"
            alt="TikTok"
            className="h-36"
          />
          <h1 className="text-3xl font-bold text-white">TikTokers Dashboard</h1>
          <p className="text-gray-400 text-sm text-center">
            Track your total lottery scans via your referral link.
          </p>
        </div>

        {!storedName && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-gray-300">Enter Your Name:</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ABEBE"
            />
            {error && (
              <p className="text-red-500 text-sm font-medium">{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-2 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-md transition"
            >
              Submit
            </button>
          </form>
        )}

        {storedName && (
          <div className="text-center space-y-6">
            <p className="text-lg">
              Hello{" "}
              <span className="font-semibold text-pink-500">{storedName}</span>,
              here are your stats:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-4 shadow-md border border-gray-600">
                <h2 className="text-xl font-semibold text-white mb-2 whitespace-nowrap">
                  Total Ticket Purchases
                </h2>
                <div className="text-3xl font-bold text-yellow-400">
                  {loading ? "Loading..." : totalTicket ?? "Not Found"}
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 shadow-md border border-gray-600">
                <h2 className="text-xl font-semibold text-white mb-2">
                  Total Scans
                </h2>
                <div className="text-3xl font-bold text-cyan-400">
                  {loading ? "Loading..." : totalScans ?? "Not Found"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}