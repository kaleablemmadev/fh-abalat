"use client";

import { useMemo, useState } from "react";
import { Search, Music, X as CloseIcon, Languages, Play, Pause } from "lucide-react";
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

// --- Zemach helpers ---
interface Zemach { text: string; }

function parseLyrics(raw: string): Zemach[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as Zemach[];
  } catch {}
  // Legacy plain text: treat as single zemach
  return [{ text: raw }];
}

interface MusicFile {
  id: string;
  title: string;
  fileUrl: string | null;
  createdAt: Date;
  categories: { id: string; name: string }[];
  uploadedBy: { fullName: string | null };
  language: "GEEZ" | "AMHARIC";
  lyrics: string;
  interpretation: string | null;
}

interface MemberMusicLibraryClientProps {
  initialFiles: MusicFile[];
  categories: { id: string; name: string }[];
}

export default function MemberMusicLibraryClient({ initialFiles, categories }: MemberMusicLibraryClientProps) {
  const [files, setFiles] = useState(initialFiles);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [viewingLyrics, setViewingLyrics] = useState<MusicFile | null>(null);
  const [playingFile, setPlayingFile] = useState<MusicFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const filteredFiles = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return files.filter((file) => {
      const matchesSearch = normalizedSearch
        ? file.title.toLowerCase().includes(normalizedSearch) ||
          file.uploadedBy.fullName?.toLowerCase().includes(normalizedSearch)
        : true;

      const matchesCategories = categoryFilter.length > 0
        ? file.categories.some(c => categoryFilter.includes(c.id))
        : true;

      return matchesSearch && matchesCategories;
    });
  }, [files, searchText, categoryFilter]);

  const toggleCategory = (id: string) => {
    setCategoryFilter(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handlePlay = (file: MusicFile) => {
    if (playingFile?.id === file.id) {
      setIsPlaying(!isPlaying);
    } else {
      setPlayingFile(file);
      setIsPlaying(true);
    }
  };

  return (
    <>
      <style jsx global>{`
        .rhap_container {
          background: hsl(var(--card)) !important;
          border-radius: 8px;
        }
        .rhap_main {
          background: hsl(var(--background)) !important;
        }
        .rhap_progress-bar {
          background: hsl(var(--muted)) !important;
        }
        .rhap_progress-filled {
          background: hsl(25 70% 45%) !important;
        }
        .rhap_progress-indicator {
          background: hsl(25 70% 45%) !important;
        }
        .rhap_controls button {
          color: hsl(var(--foreground)) !important;
        }
        .rhap_time {
          color: hsl(var(--muted-foreground)) !important;
        }
      `}</style>
      <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
          <input
            className="w-full h-10 rounded-lg border pl-10 pr-4 text-sm transition-all"
            style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
            placeholder="Search by title or singer..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => toggleCategory(cat.id)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
            style={{
              background: categoryFilter.includes(cat.id) ? "hsl(25 70% 45%)" : "hsl(var(--card))",
              borderColor: categoryFilter.includes(cat.id) ? "hsl(25 70% 50%)" : "hsl(var(--border))",
              color: categoryFilter.includes(cat.id) ? "#fff" : "hsl(var(--muted-foreground))",
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.map((file) => (
          <div
            key={file.id}
            className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate" style={{ color: "hsl(var(--foreground))" }}>
                  {file.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs opacity-60">
                    {file.uploadedBy.fullName || "Unknown"}
                  </span>
                  {file.interpretation && (
                    <span className="text-xs opacity-40">• {file.interpretation}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <Languages size={14} className="opacity-50" />
                <span className="text-xs opacity-60">
                  {file.language === "GEEZ" ? "ግዕዝ" : "Amharic"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {file.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{
                    background: "hsl(var(--muted))",
                    color: "hsl(var(--muted-foreground))",
                  }}
                >
                  {cat.name}
                </span>
              ))}
            </div>

            <div className="space-y-2">
              {file.fileUrl && (
                <button
                  onClick={() => handlePlay(file)}
                  className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-[hsl(25_70%_45%)] hover:bg-[hsl(25_70%_40%)] text-white transition-colors text-sm font-medium"
                >
                  {playingFile?.id === file.id && isPlaying ? (
                    <Pause size={14} />
                  ) : (
                    <Play size={14} />
                  )}
                  {playingFile?.id === file.id && isPlaying ? 'Pause' : 'Play'}
                </button>
              )}
              
              <button
                onClick={() => setViewingLyrics(file)}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors text-sm font-medium"
                style={{ color: "hsl(var(--foreground))" }}
              >
                <Music size={14} />
                View Lyrics
              </button>
            </div>

            {playingFile?.id === file.id && (
              <div className="mt-3">
                <AudioPlayer
                  src={file.fileUrl || ''}
                  autoPlay={isPlaying}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  style={{ width: '100%' }}
                  showJumpControls={false}
                  showSkipControls={false}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <Music size={48} className="mx-auto opacity-20 mb-4" />
          <p className="text-sm opacity-50">No music files found</p>
        </div>
      )}

      {viewingLyrics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[hsl(var(--background))] w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col">
            <div className="p-4 border-b border-[hsl(var(--border))] flex justify-between items-center bg-[hsl(var(--muted))] rounded-t-2xl">
              <div>
                <h3 className="font-bold text-lg">{viewingLyrics.title}</h3>
                <p className="text-sm opacity-60">
                  {viewingLyrics.language === "GEEZ" ? "ግዕዝ" : "Amharic"}
                  {viewingLyrics.interpretation && ` • ${viewingLyrics.interpretation}`}
                </p>
              </div>
              <button
                onClick={() => setViewingLyrics(null)}
                className="opacity-50 hover:opacity-100 p-2"
              >
                <CloseIcon size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 font-serif text-lg leading-relaxed whitespace-pre-wrap">
              {parseLyrics(viewingLyrics.lyrics).map((zemach, idx) => (
                <div 
                  key={idx} 
                  className={`mb-6 ${idx % 2 === 0 ? 'text-left' : 'text-right'}`}
                >
                  {zemach.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
