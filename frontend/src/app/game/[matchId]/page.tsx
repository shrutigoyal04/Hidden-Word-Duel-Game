"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
    username: string;
}
interface GameSyncData {
    opponentName: string;
    word: string[];
    scores: { [username: string]: number };
}
interface RoundEndData {
    winner: string | null;
    revealedWord: string;
    scores: { [username:string]: number };
}

const GamePage = () => {
    const params = useParams();
    const router = useRouter();
    const matchId = params.matchId as string;
    
    const [socket, setSocket] = useState<Socket | null>(null);
    const [myUsername, setMyUsername] = useState('You');
    const [opponentName, setOpponentName] = useState('Opponent');
    const [word, setWord] = useState<string[]>(['.','.','.']);
    const [scores, setScores] = useState({ you: 0, opponent: 0 });
    const [message, setMessage] = useState('Connecting to game...');
    const [guess, setGuess] = useState('');
    const [isRoundOver, setIsRoundOver] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [timer, setTimer] = useState(10);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            setMyUsername((jwtDecode(token) as JwtPayload).username);
        } else {
            router.push('/login');
        }
    }, [router]);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token || !matchId) return;

        const newSocket = io('http://localhost:3000', { auth: { token } });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('joinGame', { matchId });
        });

        newSocket.on('gameSync', (data: GameSyncData) => {
            setOpponentName(data.opponentName);
            setWord(data.word);
            setScores({
                you: data.scores[myUsername] || 0,
                opponent: data.scores[data.opponentName] || 0
            });
            setMessage(`Playing against ${data.opponentName}`);
        });

        newSocket.on('tickStart', () => setTimer(10));

        newSocket.on('revealTile', (data: { index: number, letter: string }) => {
            setWord(prev => {
                const newWord = [...prev];
                newWord[data.index] = data.letter;
                return newWord;
            });
        });

        newSocket.on('roundEnd', (data: RoundEndData) => {
            setIsRoundOver(true);
            const winnerName = data.winner ? (data.winner === myUsername ? "You" : data.winner) : "Nobody";
            setMessage(`${winnerName} won the round! The word was: ${data.revealedWord}`);
            setScores({
                you: data.scores[myUsername] || scores.you,
                opponent: data.scores[opponentName] || scores.opponent,
            });
        });

        newSocket.on('nextRoundStarting', (data: { wordLength: number }) => {
            setIsRoundOver(false);
            setWord(Array(data.wordLength).fill('_'));
            setMessage('Next round starting...');
            setTimer(10);
        });

        newSocket.on('matchEnd', (data: { winner: string }) => {
            setIsGameOver(true);
            const winnerName = data.winner === myUsername ? "You" : data.winner;
            setMessage(`GAME OVER! The winner is ${winnerName}`);
        });

        return () => { newSocket.disconnect(); };
    }, [matchId, router, myUsername, opponentName, scores.opponent, scores.you]);

    useEffect(() => {
        if (isRoundOver || isGameOver) return;
        const interval = setInterval(() => setTimer(prev => (prev > 0 ? prev - 1 : 0)), 1000);
        return () => clearInterval(interval);
    }, [isRoundOver, isGameOver]);

    const handleGuessSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (socket && guess && !isRoundOver) {
            socket.emit('guess', { guess });
            setGuess('');
        }
    };
    
    return (
        <div className="container mx-auto max-w-2xl text-center mt-10 p-4">
            <div className="flex justify-between items-center mb-8">
                <div className="text-left"><p className="text-white text-2xl font-bold">{myUsername}</p><p className="text-cyan-400 text-xl">Score: {scores.you}</p></div>
                <div className="text-white text-4xl font-bold">VS</div>
                <div className="text-right"><p className="text-white text-2xl font-bold">{opponentName}</p><p className="text-cyan-400 text-xl">Score: {scores.opponent}</p></div>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-lg mb-8 min-h-[150px] flex flex-col justify-center">
                 {isGameOver ? (
                    <p className="text-green-400 text-3xl">{message}</p>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-gray-400 text-lg">Guess the word:</p>
                            {!isRoundOver && <p className="text-cyan-400 text-lg">Next letter in: {timer}s</p>}
                        </div>
                        <div className="text-white text-5xl font-mono tracking-[0.2em]">{word.length > 0 ? word.join(' ') : '...'}</div>
                    </>
                )}
            </div>
            
            {isGameOver ? (
                <button onClick={() => router.push('/lobby')} className="bg-green-500 hover:bg-green-400 text-white font-bold py-4 px-8 rounded-lg text-2xl">Play Again</button>
            ) : (
                <form onSubmit={handleGuessSubmit} className="flex gap-4 justify-center mb-8">
                    <input
                        name="guess" type="text" placeholder="Guess the whole word"
                        value={guess} onChange={(e) => setGuess(e.target.value.toLowerCase())}
                        disabled={isRoundOver}
                        className="h-20 text-2xl text-center bg-gray-700 text-white border-2 border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 flex-grow disabled:bg-gray-600"
                    />
                    <button type="submit" disabled={isRoundOver} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold h-20 px-8 rounded-lg text-xl disabled:bg-gray-500">Guess Word</button>
                </form>
            )}

            <div className="bg-gray-900 p-4 rounded-lg min-h-[50px]">
                {!isRoundOver && message}
            </div>
        </div>
    );
};

export default GamePage;