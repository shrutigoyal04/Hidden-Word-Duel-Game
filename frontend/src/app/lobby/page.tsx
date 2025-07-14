"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const LobbyPage = () => {
  const router = useRouter();
  const [status, setStatus] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const socket = io('http://localhost:3000', { auth: { token } });

    socket.on('connect', () => {
      setStatus('Connected to lobby. Ready to find a match.');
    });

    socket.on('matchReady', (data: { matchId: string }) => {
      setStatus(`Match found! Redirecting to game: ${data.matchId}`);
      router.push(`/game/${data.matchId}`);
    });

    const findMatch = () => {
        setStatus('Searching for an opponent...');
        socket.emit('joinLobby');
    };

    // This is just here for demonstration; the button will call findMatch.
    // In a real app you might auto-queue.
    
    return () => {
      socket.disconnect();
    };
  }, [router]);

  // A helper function to be called by the button.
  const handleFindMatch = () => {
      const token = localStorage.getItem('access_token');
      const socket = io('http://localhost:3000', { auth: { token } });
      socket.on('connect', () => {
          setStatus('Searching for an opponent...');
          socket.emit('joinLobby');
      });
      socket.on('matchReady', (data: { matchId: string }) => {
          router.push(`/game/${data.matchId}`);
      });
  };

  return (
    <div className="container mx-auto max-w-lg text-center mt-20 p-4">
      <h1 className="text-4xl font-bold text-white mb-8">Welcome to the Lobby</h1>
      <p className="text-gray-300 mb-6">{status || "Click the button to find an opponent."}</p>
      <button onClick={handleFindMatch} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 px-8 rounded-lg text-xl">
        Find Match
      </button>
    </div>
  );
};

export default LobbyPage;
