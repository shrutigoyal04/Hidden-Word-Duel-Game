"use client"; // Add this line at the top

import Image from "next/image";
import { useEffect, useState } from 'react'; // Import useEffect and useState
import Link from 'next/link'; // Import Link

export default function Home() {
  const [hasToken, setHasToken] = useState(false); // New state to track token presence

  useEffect(() => {
    // Check for token in localStorage on component mount
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      setHasToken(true);
    }
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-white mb-8">Welcome to Hidden Word Duel</h1>

      {hasToken && ( // Conditionally render "Go to Lobby" option
        <div className="bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4 text-center">
          <p className="text-white text-lg mb-4">You are already logged in.</p>
          <Link href="/lobby" className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full block">
            Go to Lobby
          </Link>
        </div>
      )}

      {!hasToken && ( // Conditionally render login/register links if no token
        <div className="flex gap-4">
          <Link href="/login" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            Login
          </Link>
          <Link href="/register" className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            Register
          </Link>
        </div>
      )}
    </main>
  );
}
