"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Filter, Plus, Music, Play, Pause, Trash2, Loader2, Download, FileText, X as CloseIcon, AlignLeft, AlignRight, Languages, ListMusic, CheckCircle2 } from "lucide-react";

interface Playlist {
  id: string;
  name: string;
}

interface MusicFile {
  id: string;
  title: string;
  fileUrl: string | null;
  fileSize: number;
  createdAt: Date;
  categories: { id: string; name: string }[];
  uploadedBy: { fullName: string | null };
  language: "GEEZ" | "AMHARIC";
  lyrics: string;
  interpretation: string | null;
  alignment: "LEFT" | "RIGHT";
}

interface MusicLibraryClientProps {
  initialFiles: MusicFile[];
  categories: { id: string; name: string }[];
  playlists: Playlist[];
}

export default function MusicLibraryClient({ initialFiles, categories, playlists }: MusicLibraryClientProps) {
  const [files, setFiles] = useState(initialFiles);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [viewingLyrics, setViewingLyrics] = useState<MusicFile | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null);
  const [isAddingStatus, setIsAddingStatus] = useState<string | null>(null);

  const handleDownload = async (file: MusicFile) => {
    if (!file.fileUrl) return;
    setDownloadingId(file.id);
    try {
      const response = await fetch(file.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.title}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download file");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!addingToPlaylist) return;
    setIsAddingStatus(playlistId);
    try {
        const res = await fetch(`/api/mezmur/playlists/${playlistId}/songs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ musicFileId: addingToPlaylist }),
        });
        if (!res.ok) throw new Error("Failed to add");
        setAddingToPlaylist(null);
        alert("Added to playlist!");
    } catch (err) {
        alert("Error adding to playlist");
    } finally {
        setIsAddingStatus(null);
    }
  };

  const handleUpdateAlignment = async (alignment: "LEFT" | "RIGHT") => {
    if (!viewingLyrics || isUpdating) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/mezmur/music/${viewingLyrics.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alignment }),
      });

      if (!res.ok) throw new Error("Failed to update alignment");

      const updated = await res.json();

      // Update local state
      setFiles(files.map(f => f.id === updated.id ? { ...f, alignment: updated.alignment } : f));
      setViewingLyrics({ ...viewingLyrics, alignment: updated.alignment });
    } catch (err) {
      alert("Error updating alignment");
    } finally {
      setIsUpdating(false);
    }
  };

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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    setIsDeleting(id);
    try {
      const res = await fetch(`/api/mezmur/music/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setFiles(files.filter(f => f.id !== id));
    } catch (err) {
      alert("Error deleting file");
    } finally {
      setIsDeleting(null);
    }
  };

  const toggleCategory = (id: string) => {
    setCategoryFilter(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
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

        <Link
          href="/mezmur/music/upload"
          className="h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center gap-2 transition-colors shrink-0"
        >
          <Plus size={16} />
          Upload Song
        </Link>
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
            className="group rounded-xl border p-4 transition-all hover:border-[hsl(25_70%_40%)]"
            style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="font-bold text-sm truncate" style={{ color: "hsl(var(--foreground))" }}>{file.title}</h3>
                <p className="text-[10px] opacity-50 mt-0.5">Uploaded by {file.uploadedBy.fullName || "Admin"}</p>
              </div>
              <button
                onClick={() => handleDelete(file.id)}
                disabled={isDeleting === file.id}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-all"
              >
                {isDeleting === file.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {file.categories.map(c => (
                <span key={c.id} className="px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] font-bold opacity-60 uppercase tracking-wider">{c.name}</span>
              ))}
            </div>

            <div className="mt-auto space-y-4">
              <div className="bg-[hsl(var(--muted)/0.3)] rounded-lg p-1.5 border border-[hsl(var(--border))]">
                <audio controls className="w-full h-8 opacity-90 filter invert brightness-100 scale-95 origin-center">
                    <source src={file.fileUrl || ""} type="audio/mpeg" />
                    Your browser does not support the audio element.
                </audio>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewingLyrics(file)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[hsl(25_70%_45%)]/10 text-[hsl(25_70%_45%)] border border-[hsl(25_70%_45%)]/20 hover:bg-[hsl(25_70%_45%)]/20 transition-all"
                    >
                        <FileText size={12} /> Lyrics
                    </button>
                    <button
                        onClick={() => handleDownload(file)}
                        disabled={downloadingId === file.id}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                    >
                        {downloadingId === file.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                        Save
                    </button>
                    <button
                        onClick={() => setAddingToPlaylist(file.id)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                    >
                        <ListMusic size={12} /> Add
                    </button>
                </div>
                <div className="flex flex-col items-end text-[9px] opacity-30 font-bold uppercase tracking-tighter">
                  <span>{formatSize(file.fileSize)}</span>
                  <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredFiles.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-30 flex flex-col items-center">
            <Music size={48} className="mb-4" />
            <p className="text-sm font-medium">No songs found in the library.</p>
          </div>
        )}
      </div>

      {/* Lyrics Modal */}
      {viewingLyrics && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-[hsl(var(--border))] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
            style={{ background: "hsl(var(--card))" }}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-[hsl(25_70%_45%)]/10 text-[hsl(25_70%_45%)] shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate">{viewingLyrics.title}</h3>
                  <p className="text-[10px] opacity-40 uppercase tracking-widest font-bold">
                    {viewingLyrics.language} · {viewingLyrics.alignment} ALIGN
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingLyrics(null)}
                className="p-2 rounded-full hover:bg-[hsl(var(--muted))] opacity-60 transition-all"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
              {/* Primary Lyrics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Lyrics</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleUpdateAlignment("LEFT")}
                            className={`p-1 rounded ${viewingLyrics.alignment === "LEFT" ? "bg-[hsl(25_70%_45%)] text-white" : "opacity-30 hover:opacity-100"}`}
                            title="Align Left"
                        >
                            <AlignLeft size={14} />
                        </button>
                        <button
                            onClick={() => handleUpdateAlignment("RIGHT")}
                            className={`p-1 rounded ${viewingLyrics.alignment === "RIGHT" ? "bg-[hsl(25_70%_45%)] text-white" : "opacity-30 hover:opacity-100"}`}
                            title="Align Right"
                        >
                            <AlignRight size={14} />
                        </button>
                    </div>
                </div>
                <div
                  className={`text-lg font-amharic leading-relaxed whitespace-pre-wrap ${viewingLyrics.alignment === "RIGHT" ? "text-right" : "text-left"}`}
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  {viewingLyrics.lyrics}
                </div>
              </div>

              {/* Interpretation (if Ge'ez) */}
              {viewingLyrics.language === "GEEZ" && viewingLyrics.interpretation && (
                <div className="space-y-3 pt-6 border-t border-[hsl(var(--border))]">
                  <div className="flex items-center gap-2 mb-2">
                    <Languages size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Amharic Interpretation</span>
                  </div>
                  <div
                    className={`text-sm italic opacity-80 font-amharic leading-relaxed whitespace-pre-wrap ${viewingLyrics.alignment === "RIGHT" ? "text-right" : "text-left"}`}
                  >
                    {viewingLyrics.interpretation}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[hsl(var(--muted)/0.3)] border-t border-[hsl(var(--border))] rounded-b-2xl">
              <p className="text-[10px] opacity-30 text-center font-medium">
                Admin Tip: Use the alignment buttons above to flip text direction persistently.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Playlist Selector Modal */}
      {addingToPlaylist && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-sm rounded-2xl border border-[hsl(var(--border))] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
            style={{ background: "hsl(var(--card))" }}
          >
            <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
              <h3 className="font-bold text-sm uppercase tracking-wider">Add to Playlist</h3>
              <button onClick={() => setAddingToPlaylist(null)} className="opacity-50 hover:opacity-100 transition-opacity">
                <CloseIcon size={18} />
              </button>
            </div>
            <div className="p-2 max-h-60 overflow-y-auto no-scrollbar">
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => handleAddToPlaylist(pl.id)}
                  disabled={isAddingStatus === pl.id}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[hsl(var(--muted)/0.5)] transition-colors group"
                >
                  <span className="text-sm font-medium">{pl.name}</span>
                  {isAddingStatus === pl.id ? (
                    <Loader2 size={14} className="animate-spin opacity-50" />
                  ) : (
                    <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              ))}
              {playlists.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-xs opacity-40 italic">You don't have any playlists yet.</p>
                  <Link href="/mezmur/playlists" className="text-[10px] font-bold text-blue-400 hover:underline mt-2 block">Create Playlist →</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
