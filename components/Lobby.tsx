import React, { useState, useEffect, useMemo } from 'react';
import { JudgePersonality, Player } from '../types';
import { JUDGE_DESCRIPTIONS, MIN_PLAYERS } from '../constants';
import { Button } from './ui/Button';
import { Icons } from './ui/Icons';

interface LobbyProps {
  onStartGame: (players: Player[], personality: JudgePersonality, isHost: boolean) => void;
}

type LobbyMode = 'MENU' | 'HOST' | 'JOIN' | 'WAITING';

type ChannelMessage = 
  | { type: 'JOIN_REQUEST'; name: string; roomCode: string; avatar: string }
  | { type: 'JOIN_ACCEPTED'; playerId: string; roomCode: string }
  | { type: 'GAME_STARTED'; roomCode: string };

export const Lobby: React.FC<LobbyProps> = ({ onStartGame }) => {
  const [mode, setMode] = useState<LobbyMode>('MENU');
  const [roomCode, setRoomCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [personality, setPersonality] = useState<JudgePersonality>(JudgePersonality.ROASTER);
  const [joined, setJoined] = useState(false);

  const channel = useMemo(() => new BroadcastChannel('mememaster_lobby'), []);

  const colors = [
    'bg-pink-500', 'bg-rose-500', 'bg-fuchsia-500', 'bg-purple-500', 
    'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-cyan-500'
  ];

  useEffect(() => {
    channel.onmessage = (event: MessageEvent<ChannelMessage>) => {
      const msg = event.data;

      if (mode === 'HOST' && msg.type === 'JOIN_REQUEST') {
        if (msg.roomCode === roomCode) {
          // Check for duplicate names
          const finalName = players.some(p => p.name === msg.name) 
             ? `${msg.name} ${Math.floor(Math.random()*100)}` 
             : msg.name;

          const newPlayer: Player = {
            id: crypto.randomUUID(),
            name: finalName,
            score: 0,
            avatar: msg.avatar
          };
          setPlayers(prev => [...prev, newPlayer]);
          channel.postMessage({ type: 'JOIN_ACCEPTED', playerId: newPlayer.id, roomCode });
        }
      } else if (mode === 'WAITING' && msg.type === 'GAME_STARTED') {
        if (msg.roomCode === inputCode) {
           // Game started signal
        }
      }
    };
  }, [mode, roomCode, inputCode, channel, players]);

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking chars
    let code = '';
    for (let i = 0; i < 5; i++) { // 5 chars is enough usually
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateGame = () => {
    const newCode = generateRoomCode();
    setRoomCode(newCode);
    setMode('HOST');
  };

  const handleJoinGame = () => {
    if (!inputCode || !playerName) return;
    const avatar = colors[Math.floor(Math.random() * colors.length)];
    channel.postMessage({
      type: 'JOIN_REQUEST',
      name: playerName,
      roomCode: inputCode.toUpperCase(),
      avatar
    });
    setMode('WAITING');
    setJoined(true);
  };

  const handleStart = () => {
    if (players.length >= MIN_PLAYERS) {
      channel.postMessage({ type: 'GAME_STARTED', roomCode });
      onStartGame(players, personality, true);
    } else {
      alert(`צריך לפחות ${MIN_PLAYERS} שחקנים כדי להתחיל!`);
    }
  };

  const renderJudgeIcon = (type: JudgePersonality) => {
    switch (type) {
      case JudgePersonality.ROASTER: return <Icons.Flame className="w-8 h-8 text-orange-400" />;
      case JudgePersonality.GRANDMA: return <Icons.Glasses className="w-8 h-8 text-teal-300" />;
      case JudgePersonality.GEN_Z: return <Icons.Sparkles className="w-8 h-8 text-yellow-300" />;
    }
  };

  // --- RENDER: MENU ---
  if (mode === 'MENU') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in relative z-10">
        <div className="text-center mb-16 relative">
          <div className="absolute -inset-10 bg-pink-500 blur-[100px] opacity-20 rounded-full animate-pulse"></div>
          <h1 className="relative text-8xl font-black text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] transform -rotate-2">
            MEME<span className="text-pink-500">MASTER</span>
          </h1>
          <p className="text-3xl text-pink-200 font-bold tracking-widest mt-4 uppercase text-shadow-sm">
            AI Party Game
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
          <div 
            onClick={handleCreateGame}
            className="cursor-pointer group glass-panel p-8 rounded-3xl border-2 border-white/10 hover:border-pink-500 hover:bg-pink-500/10 transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center"
          >
            <div className="bg-pink-500 rounded-full p-6 mb-6 shadow-xl group-hover:scale-110 transition-transform">
               <Icons.Brain className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-black mb-2">HOST GAME</h2>
            <p className="text-pink-200 opacity-80">צור חדר, הזמן חברים והתחל את הטירוף</p>
          </div>

          <div 
            onClick={() => setMode('JOIN')}
            className="cursor-pointer group glass-panel p-8 rounded-3xl border-2 border-white/10 hover:border-cyan-500 hover:bg-cyan-500/10 transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center"
          >
            <div className="bg-cyan-500 rounded-full p-6 mb-6 shadow-xl group-hover:scale-110 transition-transform">
               <Icons.User className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-black mb-2">JOIN GAME</h2>
            <p className="text-pink-200 opacity-80">יש לך קוד? הכנס והצטרף למשחק קיים</p>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: JOIN SCREEN ---
  if (mode === 'JOIN' || mode === 'WAITING') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in max-w-md mx-auto relative z-10">
        <div className="glass-panel p-10 rounded-[2.5rem] shadow-2xl w-full text-center space-y-8 border-2 border-white/10">
          {!joined ? (
            <>
              <h2 className="text-4xl font-black text-white drop-shadow-md transform -rotate-1">הצטרפות</h2>
              <div className="space-y-6">
                <div>
                    <label className="block text-left text-pink-300 text-sm font-bold mb-2 ml-2">קוד חדר</label>
                    <input
                      type="text"
                      placeholder="XXXXX"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      className="w-full bg-zinc-950/50 border-2 border-zinc-700 rounded-2xl px-6 py-5 text-center text-3xl font-black tracking-[0.5em] uppercase focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 outline-none text-white placeholder-zinc-700 transition-all"
                      maxLength={5}
                    />
                </div>
                <div>
                    <label className="block text-left text-pink-300 text-sm font-bold mb-2 ml-2">כינוי</label>
                    <input
                      type="text"
                      placeholder="השם המגניב שלך"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full bg-zinc-950/50 border-2 border-zinc-700 rounded-2xl px-6 py-5 text-center text-2xl font-bold focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 outline-none text-white placeholder-zinc-700 transition-all"
                    />
                </div>
              </div>
              <Button 
                onClick={handleJoinGame} 
                disabled={!inputCode || !playerName}
                size="xl"
                className="w-full mt-4 shadow-xl"
              >
                Let's Go!
              </Button>
            </>
          ) : (
            <div className="space-y-8 py-10">
              <div className="text-8xl animate-bounce drop-shadow-xl">🤘</div>
              <div>
                <h2 className="text-4xl font-black text-white mb-2">אתה בפנים!</h2>
                <p className="text-pink-200 text-lg">תראה על המסך הגדול אם אתה מופיע</p>
              </div>
              <div className="bg-pink-600 text-white text-2xl font-black py-3 px-8 rounded-full inline-block shadow-lg transform rotate-2">
                {playerName}
              </div>
              <div className="flex justify-center gap-2">
                 <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                 <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-100"></div>
                 <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-200"></div>
              </div>
            </div>
          )}
        </div>
        {!joined && (
          <button onClick={() => setMode('MENU')} className="mt-8 text-pink-300/60 hover:text-white font-bold text-sm uppercase tracking-widest transition-colors">
            חזרה לתפריט
          </button>
        )}
      </div>
    );
  }

  // --- RENDER: HOST SCREEN ---
  return (
    <div className="max-w-6xl mx-auto p-4 flex flex-col items-center animate-fade-in relative z-10">
      
      {/* Game PIN Banner */}
      <div className="relative mb-16 transform hover:scale-105 transition-transform duration-500">
          <div className="absolute inset-0 bg-pink-500 blur-xl opacity-40 rounded-full"></div>
          <div className="bg-white text-zinc-950 px-16 py-6 rounded-full shadow-2xl relative z-10 border-4 border-pink-500 flex flex-col items-center">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-pink-600 mb-1">Game PIN</span>
            <span className="text-7xl font-black tracking-widest font-mono text-zinc-900">{roomCode}</span>
          </div>
      </div>

      <div className="flex flex-col md:flex-row w-full gap-10">
        
        {/* Players Grid */}
        <div className="flex-1 glass-panel rounded-[2rem] p-8 border border-white/10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black flex items-center gap-3 text-white">
              <Icons.User className="w-8 h-8 text-cyan-400" />
              שחקנים
            </h2>
            <div className="bg-zinc-900 border border-zinc-700 text-white px-5 py-2 rounded-full font-bold text-xl shadow-inner">
              {players.length} <span className="text-zinc-500 text-sm font-normal ml-1">מחוברים</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 min-h-[300px] content-start">
            {players.length === 0 ? (
               <div className="col-span-full flex flex-col items-center justify-center text-zinc-500 border-4 border-dashed border-zinc-800 rounded-3xl h-64 bg-zinc-900/30">
                  <p className="text-xl font-bold mb-2">הלובי ריק...</p>
                  <p className="text-sm opacity-60">הצטרפו עם הקוד למעלה!</p>
               </div>
            ) : (
              players.map((player) => (
                <div key={player.id} className="animate-slide-up bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-700 p-3 rounded-2xl flex items-center gap-3 shadow-lg transform hover:-translate-y-1 transition-all">
                  <div className={`p-2 rounded-xl ${player.avatar} shadow-md`}>
                    <Icons.User className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-lg truncate text-white">{player.name}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar: Settings & Start */}
        <div className="w-full md:w-96 space-y-6">
          {/* Personality Selector */}
          <div className="glass-panel p-6 rounded-[2rem] border border-white/10">
             <h3 className="text-xl font-black mb-5 flex items-center gap-2 text-white">
               <Icons.Brain className="w-6 h-6 text-pink-500" /> סגנון שופט
             </h3>
             <div className="space-y-3">
               {Object.entries(JUDGE_DESCRIPTIONS).map(([key, info]) => {
                  const isSelected = personality === key;
                  return (
                    <div 
                      key={key}
                      onClick={() => setPersonality(key as JudgePersonality)}
                      className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                        isSelected 
                          ? 'border-pink-500 bg-pink-500/20 shadow-lg' 
                          : 'border-zinc-800 hover:border-zinc-600 bg-zinc-900/50'
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${isSelected ? 'bg-pink-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                         {renderJudgeIcon(key as JudgePersonality)}
                      </div>
                      <div className="text-left flex-1">
                        <div className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-zinc-400'}`}>{info.name}</div>
                      </div>
                    </div>
                  );
               })}
             </div>
          </div>

          <Button 
            onClick={handleStart} 
            size="xl" 
            variant="primary"
            className="w-full shadow-2xl shadow-pink-500/20"
            disabled={players.length < MIN_PLAYERS}
          >
             התחל משחק 🚀
          </Button>

          <div className="text-center pt-2">
            <button onClick={() => setMode('MENU')} className="text-zinc-500 hover:text-white font-bold text-sm uppercase tracking-widest transition-colors">
               ביטול ויציאה
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};