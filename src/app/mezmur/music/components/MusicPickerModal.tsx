"use client";

import { useState, useMemo } from "react";
import { X, Search, CheckCircle2, Music, Loader2, Save } from "lucide-react";

interface MusicPickerModalProps {
  onClose: () => void;
  onAdd: (musicFileIds: string[]) => Promise<void>;
  alreadyAddedIds: string[];
}

export default function MusicPickerModal({ onClose, onAdd, alreadyAddedIds }: MusicPickerModalProps) {
  const [allSongs, setAllSongs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch all songs on mount
  useMemo(() => {
    fetch("/api/mezmur/music/upload").then(res => res.json()).then(data => {
      setAllSongs(Array.isArray(data) ? data : (data.files || []));
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const filteredSongs = useMemo(() => {
    return allSongs.filter(s =>
      !alreadyAddedIds.includes(s.id) &&
      s.title.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [allSongs, alreadyAddedIds, searchText]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) return;
    setIsSaving(true);
    try {
      await onAdd(selectedIds);
      onClose();
    } catch (err) {
      alert("Error adding songs");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl max-h-[80vh] rounded-2xl border border-[hsl(var(--border))] flex flex-col shadow-2xl bg-[hsl(var(--card))]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider">Add Songs from Library</h3>
            <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">{selectedIds.length} selected</p>
          </div>
          <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity"><X size={20} /></button>
        </div>

        <div className="p-4 border-b border-[hsl(var(--border))]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
            <input
              type="text"
              className="w-full h-10 pl-10 pr-4 bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] rounded-lg text-sm outline-none"
              placeholder="Search library..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
          {isLoading ? (
            <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto opacity-20" size={32} /></div>
          ) : filteredSongs.length === 0 ? (
            <div className="p-20 text-center opacity-30 italic text-sm">No available songs found.</div>
          ) : (
            <div className="grid grid-cols-1 gap-1">
              {filteredSongs.map(song => (
                <button
                  key={song.id}
                  onClick={() => toggleSelection(song.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    selectedIds.includes(song.id) ? "bg-[hsl(25_70%_45%)]/10 border border-[hsl(25_70%_45%)]/20" : "hover:bg-[hsl(var(--muted)/0.5)] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 text-left">
                    <div className={`p-2 rounded-lg ${selectedIds.includes(song.id) ? "bg-[hsl(25_70%_45%)] text-white" : "bg-zinc-100 opacity-50"}`}>
                      <Music size={14} />
                    </div>
                    <span className="text-xs font-bold truncate">{song.title}</span>
                  </div>
                  {selectedIds.includes(song.id) && <CheckCircle2 size={16} className="text-[hsl(25_70%_45%)]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-[hsl(var(--muted)/0.3)] border-t border-[hsl(var(--border))] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold opacity-50 hover:opacity-100">Cancel</button>
          <button
            onClick={handleSave}
            disabled={isSaving || selectedIds.length === 0}
            className="px-8 py-2 bg-[hsl(25_70%_45%)] text-white rounded-lg text-xs font-bold flex items-center gap-2 disabled:opacity-30"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Add {selectedIds.length} Songs
          </button>
        </div>
      </div>
    </div>
  );
}
