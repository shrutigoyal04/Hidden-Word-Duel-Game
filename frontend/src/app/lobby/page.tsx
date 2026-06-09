"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const LobbyPage = () => {
  const router = useRouter();
  const [status, setStatus] = useState('');
  // A single socket instance for the lobby, reused by the Find Match button.
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const socket = io('http://localhost:3000', { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('Connected to lobby. Ready to find a match.');
    });

    socket.on('matchReady', (data: { matchId: string }) => {
      setStatus(`Match found! Redirecting to game: ${data.matchId}`);
      router.push(`/game/${data.matchId}`);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [router]);

  // Queue this player for matchmaking using the existing lobby socket.
  const handleFindMatch = () => {
    if (!socketRef.current) return;
    setStatus('Searching for an opponent...');
    socketRef.current.emit('joinLobby');
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
