"use client";
import { useState, useEffect } from "react";

export default function TestConnection() {
  const [message, setMessage] = useState("Waiting for Python...");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    // This fetches data from your running Python server
    fetch("http://127.0.0.1:8000/api/health")
      .then((res) => res.json())
      .then((data) => {
        setMessage(data.message);
        setStatus("success");
      })
      .catch((error) => {
        console.error(error);
        setMessage("Error: Make sure the Python backend is running!");
        setStatus("error");
      });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-black">
      <div className="p-8 bg-white shadow-xl rounded-xl border border-gray-200">
        <h1 className="text-2xl font-bold mb-4">PTL System Check</h1>
        
        <div className={`p-4 rounded-lg ${status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <strong>Status:</strong> {message}
        </div>

        <p className="mt-4 text-sm text-gray-500">
          If this works, your Next.js frontend is successfully talking to your Python backend.
        </p>
      </div>
    </div>
  );
}