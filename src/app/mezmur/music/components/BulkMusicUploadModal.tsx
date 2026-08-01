"use client";

import { useState, useRef } from "react";
import { Upload, X, Music, Loader2, Languages, AlignLeft, AlignRight, CheckCircle2, AlertCircle } from "lucide-react";

interface BulkMusicUploadModalProps {
  categories: { id: string; name: string }[];
  adminId: string;
  onClose: () => void;
  onSuccess: () => void;
  targetCategoryId?: string;
  targetPlaylistId?: string;
}

export default function BulkMusicUploadModal({
  categories,
  adminId,
  onClose,
  onSuccess,
  targetCategoryId,
  targetPlaylistId
}: BulkMusicUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [language, setLanguage] = useState<"GEEZ" | "AMHARIC">("AMHARIC");
  const [alignment, setAlignment] = useState<"LEFT" | "RIGHT">("LEFT");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(targetCategoryId ? [targetCategoryId] : []);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleFiles = (selectedFiles: FileList) => {
    const validFiles = Array.from(selectedFiles).filter(f => f.type.startsWith("audio/"));
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    setIsUploading(true);
    setStatus("idle");
    setProgress(0);

    const formData = new FormData();
    files.forEach(f => formData.append("files", f));
    formData.append("uploadedById", adminId);
    formData.append("language", language);
    formData.append("alignment", alignment);
    if (targetPlaylistId) formData.append("playlistId", targetPlaylistId);
    selectedCategories.forEach(id => formData.append("categoryIds", id));

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setStatus("success");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setStatus("error");
      }
      setIsUploading(false);
    });

    xhr.open("POST", "/api/mezmur/music/bulk-upload");
    xhr.send(formData);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-[hsl(var(--border))] flex flex-col shadow-2xl bg-[hsl(var(--card))]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
          <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
            <Upload size={16} /> Bulk Upload Music
          </h3>
          <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          <div
            className="border-2 border-dashed border-[hsl(var(--border))] rounded-xl p-8 text-center hover:bg-[hsl(var(--muted)/0.3)] transition-all cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*"
              className="hidden"
              onChange={e => e.target.files && handleFiles(e.target.files)}
            />
            <Music size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-bold">Click to select multiple audio files</p>
            <p className="text-[10px] opacity-40 mt-1 uppercase font-bold tracking-wider">MP3, WAV, M4A supported</p>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Selected Files ({files.length})</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))]">
                    <span className="text-[10px] font-bold truncate pr-4">{f.name}</span>
                    <button type="button" onClick={() => removeFile(i)} className="text-red-500 opacity-50 hover:opacity-100"><X size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[hsl(var(--border))]">
            <div className="space-y-4">
               <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Language (Batch)</label>
                  <div className="flex p-1 rounded-lg bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))]">
                    {["AMHARIC", "GEEZ"].map(lang => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setLanguage(lang as any)}
                        className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${language === lang ? "bg-[hsl(25_70%_45%)] text-white shadow-lg" : "opacity-50"}`}
                      >
                        {lang === "AMHARIC" ? "Amharic" : "Ge'ez"}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Alignment (Batch)</label>
                  <div className="flex p-1 rounded-lg bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))]">
                    <button
                      type="button"
                      onClick={() => setAlignment("LEFT")}
                      className={`flex-1 py-1.5 rounded-md transition-all ${alignment === "LEFT" ? "bg-[hsl(25_70%_45%)] text-white shadow-lg" : "opacity-50"}`}
                    >
                      <AlignLeft size={14} className="mx-auto" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlignment("RIGHT")}
                      className={`flex-1 py-1.5 rounded-md transition-all ${alignment === "RIGHT" ? "bg-[hsl(25_70%_45%)] text-white shadow-lg" : "opacity-50"}`}
                    >
                      <AlignRight size={14} className="mx-auto" />
                    </button>
                  </div>
               </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Categories (Batch)</label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border bg-[hsl(var(--muted)/0.2)]" style={{ borderColor: "hsl(var(--border))" }}>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-2 py-1 rounded text-[9px] font-bold border transition-all ${
                        selectedCategories.includes(cat.id) ? "bg-[hsl(25_70%_45%)] text-white border-transparent" : "bg-white border-zinc-200 text-zinc-500"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
            </div>
          </div>
        </form>

        <div className="p-4 bg-[hsl(var(--muted)/0.3)] border-t border-[hsl(var(--border))]">
          {isUploading && (
            <div className="mb-4 space-y-1">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-50">
                <span>Uploading {files.length} items...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                <div className="h-full bg-[hsl(25_70%_45%)] transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="mb-4 p-2 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded flex items-center gap-2">
              <CheckCircle2 size={14} /> Batch uploaded successfully!
            </div>
          )}

          {status === "error" && (
            <div className="mb-4 p-2 bg-red-500/10 text-red-500 text-[10px] font-bold rounded flex items-center gap-2">
              <AlertCircle size={14} /> Failed to complete bulk upload.
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-xs font-bold opacity-50 hover:opacity-100 transition-opacity">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={isUploading || files.length === 0}
              className="px-8 py-2 bg-[hsl(25_70%_45%)] hover:bg-[hsl(25_70%_40%)] text-white rounded-lg text-xs font-bold transition-all disabled:opacity-30 flex items-center gap-2"
            >
              {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Start Batch Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
