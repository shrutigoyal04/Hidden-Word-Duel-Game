"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const LobbyPage = () => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Ensure this code runs only on the client
    const storedToken = localStorage.getItem('access_token');
    if (!storedToken) {
      // If no token is found, redirect to login page
      router.push('/login');
    } else {
      setToken(storedToken);
    }
  }, [router]);

  const handleFindMatch = () => {
    // We will implement the WebSocket logic here in the next step
    console.log('Finding match with token:', token);
    alert('Connecting to matchmaking... (functionality to be added)');
  };

  if (!token) {
    // Render nothing or a loading spinner while checking for the token
    return null;
  }

  return (
    <div className="container mx-auto max-w-lg text-center mt-20 p-4">
      <h1 className="text-4xl font-bold text-white mb-8">Welcome to the Lobby</h1>
      <p className="text-gray-300 mb-12">
        You are ready to duel! Click the button below to find an opponent.
      </p>
      <button
        onClick={handleFindMatch}
        className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-transform duration-300 ease-in-out"
      >
        Find Match
      </button>
    </div>
  );
};

export default LobbyPage;
