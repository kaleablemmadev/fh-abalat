"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, Music, Trash2, Loader2, Download, FileText, X as CloseIcon, Languages, ListMusic, Edit, Save, Upload } from "lucide-react";
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

import BulkMusicUploadModal from "./BulkMusicUploadModal";

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

function serializeLyrics(zemachs: Zemach[]): string {
  return JSON.stringify(zemachs);
}

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
  adminId: string;
}

export default function MusicLibraryClient({ initialFiles, categories, playlists, adminId }: MusicLibraryClientProps) {
  const router = useRouter();
  const [files, setFiles] = useState(initialFiles);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [viewingLyrics, setViewingLyrics] = useState<MusicFile | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null);
  const [isAddingStatus, setIsAddingStatus] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<MusicFile | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

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

  // Zemach state for the edit modal
  const [editingZemachs, setEditingZemachs] = useState<Zemach[]>([{ text: "" }]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFile || isUpdating) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/mezmur/music/${editingFile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingFile.title,
          language: editingFile.language,
          lyrics: serializeLyrics(editingZemachs),
          interpretation: editingFile.interpretation,
          alignment: "LEFT", // kept for DB compat
          categoryIds: editingFile.categories.map(c => c.id)
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      const updated = await res.json();
      setFiles(files.map(f => f.id === updated.id ? updated : f));
      setEditingFile(null);
    } catch (err) {
      alert("Error updating music info");
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditModal = (file: MusicFile) => {
    setEditingFile(file);
    setEditingZemachs(parseLyrics(file.lyrics));
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
            placeholder="በመዝሙር ወይም ወረብ ስም ፈልግ..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <Link
          href="/mezmur/music/upload"
          className="h-10 px-4 rounded-lg bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] text-sm font-bold flex items-center gap-2 transition-colors shrink-0 border border-[hsl(var(--border))]"
        >
          <Plus size={16} />
          መዝሙር አስገባ
        </Link>

        <button
          onClick={() => setIsBulkUploading(true)}
          className="h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center gap-2 transition-colors shrink-0"
        >
          <Upload size={16} />
          ብዙ መዝሙራት
        </button>
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
                <p className="text-[10px] opacity-50 mt-0.5">በ{file.uploadedBy.fullName || "Admin"} ተጫነ</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => openEditModal(file)}
                  className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-500 transition-all"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(file.id)}
                  disabled={isDeleting === file.id}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-all"
                >
                  {isDeleting === file.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {file.categories.map(c => (
                <span key={c.id} className="px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] font-bold opacity-60 uppercase tracking-wider">{c.name}</span>
              ))}
            </div>

            <div className="mt-auto space-y-4">
              <div className="rounded-lg overflow-hidden border border-[hsl(var(--border))]">
                {file.fileUrl ? (
                  <AudioPlayer
                    src={file.fileUrl}
                    showJumpControls={false}
                    layout="horizontal-reverse"
                    customAdditionalControls={[]}
                    customVolumeControls={[]}
                    style={{
                      background: "hsl(var(--muted)/0.3)",
                      boxShadow: "none",
                      padding: "4px 8px"
                    }}
                  />
                ) : (
                  <div className="h-10 flex items-center justify-center text-[10px] opacity-40 font-bold uppercase tracking-widest italic bg-[hsl(var(--muted)/0.3)]">
                    ምንም መዝሙር የለም
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewingLyrics(file)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[hsl(25_70%_45%)]/10 text-[hsl(25_70%_45%)] border border-[hsl(25_70%_45%)]/20 hover:bg-[hsl(25_70%_45%)]/20 transition-all"
                    >
                        <FileText size={12} /> ቃላት
                    </button>
                    <button
                        onClick={() => handleDownload(file)}
                        disabled={downloadingId === file.id}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                    >
                        {downloadingId === file.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                        Download
                    </button>
                    <button
                        onClick={() => setAddingToPlaylist(file.id)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                    >
                        <ListMusic size={12} /> ምድብ
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
            <p className="text-sm font-medium">በመዝገብ ውስጥ ምንም መዝሙር አልተገኘም</p>
          </div>
        )}
      </div>

      {/* Lyrics Modal */}
      {viewingLyrics && (() => {
        const zemachs = parseLyrics(viewingLyrics.lyrics);
        return (
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
                      {viewingLyrics.language} · {zemachs.length} ዘማች{zemachs.length !== 1 ? "s" : ""}
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

              {/* Audio Player in Modal */}
              {viewingLyrics.fileUrl && (
                <div className="px-6 py-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.1)]">
                  <div className="rounded-lg overflow-hidden border border-[hsl(var(--border))]">
                    <AudioPlayer
                      src={viewingLyrics.fileUrl}
                      showJumpControls={false}
                      layout="horizontal-reverse"
                      customAdditionalControls={[]}
                      customVolumeControls={[]}
                      style={{
                        background: "hsl(var(--muted)/0.3)",
                        boxShadow: "none",
                        padding: "8px 12px"
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Modal Content — Zemachs */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {zemachs.map((zemach, index) => {
                  const isLeft = index % 2 === 0;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                          style={{
                            background: isLeft ? "hsl(25 70% 45% / 0.12)" : "hsl(210 70% 45% / 0.12)",
                            color: isLeft ? "hsl(25 70% 55%)" : "hsl(210 70% 60%)"
                          }}
                        >
                          አዝማች {index + 1}
                        </span>
                        <div className="flex-1 h-px opacity-10" style={{ background: "hsl(var(--foreground))" }} />
                      </div>
                      <div
                        className={`text-lg font-amharic leading-relaxed whitespace-pre-wrap ${isLeft ? "text-left" : "text-right"}`}
                        style={{ color: "hsl(var(--foreground))" }}
                      >
                        {zemach.text}
                      </div>
                    </div>
                  );
                })}

                {/* Interpretation (if Ge'ez) */}
                {viewingLyrics.language === "GEEZ" && viewingLyrics.interpretation && (
                  <div className="space-y-3 pt-6 border-t border-[hsl(var(--border))]">
                    <div className="flex items-center gap-2 mb-2">
                      <Languages size={14} className="text-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Amharic Interpretation</span>
                    </div>
                    <div className="text-sm italic opacity-80 font-amharic leading-relaxed whitespace-pre-wrap text-left">
                      {viewingLyrics.interpretation}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

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

      {/* Edit Music Modal */}
      {editingFile && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-xl max-h-[90vh] rounded-2xl border border-[hsl(var(--border))] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
            style={{ background: "hsl(var(--card))" }}
          >
            <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
              <h3 className="font-bold text-sm uppercase tracking-wider">መዝሙር መረጃ አስተካክል</h3>
              <button onClick={() => setEditingFile(null)} className="opacity-50 hover:opacity-100 transition-opacity">
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">የመዝሙር ስም</label>
                <input
                  className="w-full h-10 rounded-lg border px-4 text-sm transition-all outline-none focus:border-[hsl(25_70%_40%)]"
                  style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
                  value={editingFile.title}
                  onChange={e => setEditingFile({...editingFile, title: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">ቋንቋ</label>
                <select
                  className="w-full h-10 rounded-lg border px-3 text-sm transition-all outline-none focus:border-[hsl(25_70%_40%)] appearance-none"
                  style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
                  value={editingFile.language}
                  onChange={e => setEditingFile({...editingFile, language: e.target.value as any})}
                >
                  <option value="AMHARIC">ዐማርኛ</option>
                  <option value="GEEZ">ግእዝ</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">ምድብ</label>
                <div className="flex flex-wrap gap-2 p-3 rounded-lg border bg-[hsl(var(--muted)/0.2)]" style={{ borderColor: "hsl(var(--border))" }}>
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 rounded border-gray-300 text-[hsl(25_70%_45%)] focus:ring-[hsl(25_70%_45%)]"
                        checked={editingFile.categories.some(c => c.id === cat.id)}
                        onChange={(e) => {
                          const newCats = e.target.checked
                            ? [...editingFile.categories, cat]
                            : editingFile.categories.filter(c => c.id !== cat.id);
                          setEditingFile({...editingFile, categories: newCats});
                        }}
                      />
                      <span className="text-[10px] font-medium group-hover:text-[hsl(var(--primary))] transition-colors">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Zemachs Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">የመዝሙር ቃላት</label>
                </div>
                <div className="space-y-3">
                  {editingZemachs.map((zemach, index) => {
                    const isLeft = index % 2 === 0;
                    return (
                      <div key={index} className="relative group/zemach">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                            style={{
                              background: isLeft ? "hsl(25 70% 45% / 0.15)" : "hsl(210 70% 45% / 0.15)",
                              color: isLeft ? "hsl(25 70% 50%)" : "hsl(210 70% 55%)"
                            }}
                          >
                            አዝማች {index + 1} · {isLeft ? "← ግራ" : "ቀኝ →"}
                          </span>
                          {editingZemachs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setEditingZemachs(prev => prev.filter((_, i) => i !== index))}
                              className="p-1 rounded hover:bg-red-500/10 text-red-400 opacity-0 group-hover/zemach:opacity-100 transition-all"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                        <textarea
                          className={`w-full h-28 rounded-lg border px-4 py-2 text-sm transition-all outline-none focus:border-[hsl(25_70%_40%)] resize-none font-amharic ${isLeft ? "text-left" : "text-right"}`}
                          style={{
                            background: "hsl(var(--background))",
                            borderColor: isLeft ? "hsl(25 70% 45% / 0.3)" : "hsl(210 70% 45% / 0.3)"
                          }}
                          value={zemach.text}
                          onChange={e => setEditingZemachs(prev => prev.map((z, i) => i === index ? { text: e.target.value } : z))}
                        />
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setEditingZemachs(prev => [...prev, { text: "" }])}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-dashed text-[10px] font-bold uppercase tracking-wider opacity-40 hover:opacity-80 transition-all"
                  style={{ borderColor: "hsl(var(--border))" }}
                >
                  <Plus size={12} /> አዝማጭ ጨምር
                </button>
              </div>

              {editingFile.language === "GEEZ" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Interpretation (Amharic)</label>
                  <textarea
                    className="w-full h-32 rounded-lg border px-4 py-2 text-sm transition-all outline-none focus:border-[hsl(25_70%_40%)] resize-none font-amharic"
                    style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
                    value={editingFile.interpretation || ""}
                    onChange={e => setEditingFile({...editingFile, interpretation: e.target.value})}
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
                <button
                  type="button"
                  onClick={() => setEditingFile(null)}
                  className="px-4 py-2 text-sm font-medium opacity-50 hover:opacity-100 transition-opacity"
                >
                  ተመለስ
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-8 py-2 rounded-lg bg-[hsl(25_70%_45%)] text-white text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  አስተካክል
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkUploading && (
        <BulkMusicUploadModal
            categories={categories}
            adminId={adminId}
            onClose={() => setIsBulkUploading(false)}
            onSuccess={() => {
                router.refresh();
                window.location.reload();
            }}
        />
      )}
    </div>
  );
}
