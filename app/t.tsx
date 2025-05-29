"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/dashboardCard";
import { FaCrown } from "react-icons/fa";

export default function ScannerLeaderboard() {
  const [scanners, setScanners] = useState([]);
  const [total, setTotal] = useState([]);
  const [tickets, setTickets] = useState({});

  useEffect(() => {
    fetch(
      "https://phmeds46kpaksdnpwmwxlwvrvy0pfmkd.lambda-url.us-east-1.on.aws/api/v2/user/scannedByCount/Tiktokers"
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "SUCCESS") {
          setTotal(data.data.totalUsers);
          const sorted = data.data.results.sort((a, b) => b.count - a.count);
          setScanners(sorted);
          // Fetch ticket counts for each scanner
          Promise.all(
            sorted.map((s) =>
              fetch(
                https://yyjfecgkn3p2y2jldnvrnwqqq40fcmth.lambda-url.us-east-1.on.aws/api/v2/user/registeredByCount/${encodeURIComponent(s.scanner)}
              )
                .then((res) => res.json())
                .then((ticketData) => ({
                  name: s.scanner,
                  tickets:
                    ticketData.status === "SUCCESS"
                      ? ticketData.data.totalTickets
                      : 0,
                }))
                .catch(() => ({ name: s.scanner, tickets: 0 }))
            )
          ).then((results) => {
            const ticketMap = {};
            results.forEach((r) => {
              ticketMap[r.name] = r.tickets;
            });
            setTickets(ticketMap);
          });
        }
      });
  }, []);
  console.log(scanners);
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-white py-12 px-4 flex flex-col items-center">
      <h1 className="text-4xl sm:text-5xl font-bold text-yellow-600 mb-8 text-center drop-shadow-sm">
        🏆 QR Scanner Leaderboard
      </h1>
      <p className="text-4xl sm:text-5xl font-bold text-green-600 mb-8 text-center drop-shadow-sm">
        Total Registered {total}
      </p>

      <div className="w-full max-w-4xl space-y-8">
        {scanners.slice(0, 3).map((scanner, index) => (
          <Card
            key={scanner.scanner}
            className={`flex items-center sm:items-start flex-col sm:flex-row gap-4 p-6 shadow-xl rounded-xl border-l-8 transition-transform hover:scale-[1.02] ${
              index === 0
                ? "border-yellow-500 bg-yellow-100"
                : index === 1
                ? "border-gray-400 bg-gray-100"
                : "border-amber-300 bg-amber-100"
            }`}
          >
            <FaCrown
              className={`text-4xl ${
                index === 0
                  ? "text-yellow-500"
                  : index === 1
                  ? "text-gray-500"
                  : "text-amber-500"
              }`}
            />
            <div className="text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-semibold capitalize text-gray-800">
                {scanner.scanner}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                🚀 Total Scans:{" "}
                <span className="font-bold text-gray-800">{scanner.count}</span>
              </p>
            </div>
          </Card>
        ))}
      <div className="mt-12">
          <h3 className="text-2xl font-bold mb-4 text-gray-700 text-center">
            📋 Full Leaderboard
          </h3>
          <div className="space-y-3">
            {scanners.map((s, idx) => (
              <div
                key={s.scanner}
                className="flex items-center justify-between bg-white px-5 py-3 rounded-lg shadow-sm border hover:bg-yellow-50 transition"
              >
                <span className="text-gray-700 font-medium capitalize">
                  <span className="text-yellow-500 font-bold">#{idx + 1}</span>{" "}
                  {s.scanner}
                </span>
                <span className="text-gray-900 font-semibold">
                  {s.count} scans
                  <span className="ml-3 text-blue-700 font-semibold">
                    | {tickets[s.scanner] ?? '...'} tickets
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}