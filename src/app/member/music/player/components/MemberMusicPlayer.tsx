"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Music, List, Languages } from "lucide-react";

interface MusicFile {
  id: string;
  title: string;
  fileUrl: string | null;
  lyrics: string;
  language: "GEEZ" | "AMHARIC";
  interpretation: string | null;
}

interface MemberMusicPlayerProps {
  musicFiles: MusicFile[];
  categoryName: string;
}

export default function MemberMusicPlayer({ musicFiles, categoryName }: MemberMusicPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"none" | "one" | "all">("none");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showQueue, setShowQueue] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const currentFile = musicFiles[currentIndex];

  const parseLyrics = (raw: string): { text: string }[] => {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return [{ text: raw }];
  };

  const playNext = useCallback(() => {
    if (isShuffle) {
      const nextIndex = Math.floor(Math.random() * musicFiles.length);
      setCurrentIndex(nextIndex);
    } else {
      if (currentIndex < musicFiles.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (repeatMode === "all") {
        setCurrentIndex(0);
      } else {
        setIsPlaying(false);
      }
    }
  }, [currentIndex, isShuffle, musicFiles.length, repeatMode]);

  const playPrevious = () => {
    if (currentTime > 5) {
      if (audioRef.current) audioRef.current.currentTime = 0;
    } else {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else {
        setCurrentIndex(musicFiles.length - 1);
      }
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentIndex]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (repeatMode === "one") {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      playNext();
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const lyrics = parseLyrics(currentFile?.lyrics || "");

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Player Section */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-8 shadow-2xl flex flex-col items-center">
        <div className="w-64 h-64 rounded-2xl bg-gradient-to-br from-[hsl(25_70%_45%)] to-[hsl(25_70%_20%)] flex items-center justify-center shadow-inner mb-8 relative overflow-hidden group">
          <Music size={80} className="text-white opacity-20" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
             <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform"
             >
                {isPlaying ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} className="ml-1" />}
             </button>
          </div>
        </div>

        <div className="text-center mb-8 w-full">
          <h2 className="text-2xl font-bold truncate px-4">{currentFile?.title}</h2>
          <div className="flex items-center justify-center gap-2 mt-1 opacity-50">
            <Languages size={14} />
            <span className="text-sm">{currentFile?.language === "GEEZ" ? "ግዕዝ" : "Amharic"}</span>
          </div>
        </div>

        <audio
          ref={audioRef}
          src={currentFile?.fileUrl || ""}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />

        {/* Progress Bar */}
        <div className="w-full space-y-2 mb-8">
          <div
            className="h-1.5 w-full bg-[hsl(var(--muted))] rounded-full overflow-hidden cursor-pointer relative"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const pct = x / rect.width;
              if (audioRef.current) audioRef.current.currentTime = pct * duration;
            }}
          >
            <div
              className="h-full bg-[hsl(25_70%_45%)] transition-all duration-100"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold opacity-40 uppercase tracking-widest">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between w-full max-w-xs mb-8">
          <button
            onClick={() => setIsShuffle(!isShuffle)}
            className={`p-2 transition-colors ${isShuffle ? 'text-[hsl(25_70%_45%)]' : 'opacity-40 hover:opacity-100'}`}
          >
            <Shuffle size={18} />
          </button>

          <button onClick={playPrevious} className="p-2 opacity-80 hover:opacity-100 hover:scale-110 transition-all">
            <SkipBack fill="currentColor" size={28} />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 rounded-full bg-[hsl(25_70%_45%)] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? <Pause fill="currentColor" size={28} /> : <Play fill="currentColor" size={28} className="ml-1" />}
          </button>

          <button onClick={playNext} className="p-2 opacity-80 hover:opacity-100 hover:scale-110 transition-all">
            <SkipForward fill="currentColor" size={28} />
          </button>

          <button
            onClick={() => {
              if (repeatMode === "none") setRepeatMode("all");
              else if (repeatMode === "all") setRepeatMode("one");
              else setRepeatMode("none");
            }}
            className={`p-2 transition-colors ${repeatMode !== "none" ? 'text-[hsl(25_70%_45%)]' : 'opacity-40 hover:opacity-100'}`}
          >
            {repeatMode === "one" ? <Repeat size={18} className="relative" /> : <Repeat size={18} />}
            {repeatMode === "one" && <span className="absolute text-[8px] font-bold">1</span>}
          </button>
        </div>

        {/* Volume & Queue */}
        <div className="w-full flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Volume2 size={16} className="opacity-40" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                if (audioRef.current) audioRef.current.volume = v;
              }}
              className="w-full h-1 bg-[hsl(var(--muted))] rounded-full appearance-none cursor-pointer accent-[hsl(25_70%_45%)]"
            />
          </div>
          <button
            onClick={() => setShowQueue(!showQueue)}
            className={`p-2 rounded-lg transition-colors ${showQueue ? 'bg-[hsl(var(--muted))] text-[hsl(25_70%_45%)]' : 'opacity-40 hover:opacity-100'}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Lyrics / Queue Section */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl h-[600px] flex flex-col overflow-hidden shadow-xl">
        <div className="p-6 border-b border-[hsl(var(--border))] flex justify-between items-center">
          <h3 className="font-bold uppercase tracking-widest text-xs opacity-50">
            {showQueue ? "Up Next" : "Lyrics (ግጥም)"}
          </h3>
          <button
            onClick={() => setShowQueue(!showQueue)}
            className="text-[10px] font-bold uppercase text-[hsl(25_70%_45%)] hover:underline"
          >
            {showQueue ? "Show Lyrics" : "Show Queue"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {showQueue ? (
            <div className="space-y-2">
              {musicFiles.map((file, idx) => (
                <button
                  key={file.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-full text-left p-4 rounded-xl flex items-center gap-3 transition-all ${
                    idx === currentIndex
                      ? 'bg-[hsl(25_70%_45%)] text-white shadow-md'
                      : 'hover:bg-[hsl(var(--muted))]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${idx === currentIndex ? 'bg-white/20' : 'bg-[hsl(var(--background))] border border-[hsl(var(--border))]'}`}>
                    {idx === currentIndex && isPlaying ? (
                       <div className="flex gap-0.5 items-end h-3">
                          <div className="w-0.5 bg-white animate-music-bar-1" />
                          <div className="w-0.5 bg-white animate-music-bar-2" />
                          <div className="w-0.5 bg-white animate-music-bar-3" />
                       </div>
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{file.title}</p>
                    <p className={`text-[10px] uppercase tracking-wider ${idx === currentIndex ? 'opacity-70' : 'opacity-40'}`}>
                      {file.language}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-6 text-center lg:text-left">
              {lyrics.map((line, idx) => (
                <p
                  key={idx}
                  className={`text-lg md:text-xl font-medium leading-relaxed transition-all duration-500 ${
                    isPlaying ? 'opacity-100' : 'opacity-50'
                  }`}
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  {line.text}
                </p>
              ))}
              {currentFile?.interpretation && (
                <div className="mt-12 pt-8 border-t border-[hsl(var(--border))]">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3">Interpretation</h4>
                  <p className="text-sm italic opacity-70 leading-relaxed">
                    {currentFile.interpretation}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
