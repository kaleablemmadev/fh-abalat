"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Loader2, Music, CheckCircle2, AlertCircle, Type, Languages, Plus, Trash2 } from "lucide-react";

interface MusicUploadFormProps {
  categories: { id: string; name: string }[];
  adminId: string;
}

interface Zemach {
  text: string;
}

export default function MusicUploadForm({ categories, adminId }: MusicUploadFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState<"GEEZ" | "AMHARIC">("AMHARIC");
  const [zemachs, setZemachs] = useState<Zemach[]>([{ text: "" }]);
  const [interpretation, setInterpretation] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFile = (selectedFile: File) => {
    if (selectedFile.size > 50 * 1024 * 1024) {
      alert("File too large (max 50MB)");
      return;
    }
    setFile(selectedFile);
    if (!title) setTitle(selectedFile.name.split(".")[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith("audio/")) {
        handleFile(droppedFile);
      } else {
        alert("Please drop an audio file.");
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const addZemach = () => {
    setZemachs(prev => [...prev, { text: "" }]);
  };

  const removeZemach = (index: number) => {
    if (zemachs.length === 1) return; // Keep at least one
    setZemachs(prev => prev.filter((_, i) => i !== index));
  };

  const updateZemach = (index: number, text: string) => {
    setZemachs(prev => prev.map((z, i) => i === index ? { text } : z));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    const hasContent = zemachs.some(z => z.text.trim().length > 0);
    if (!hasContent) {
      alert("Please add at least one Zemach with content.");
      return;
    }

    setIsUploading(true);
    setStatus("idle");
    setErrorMessage("");
    setUploadProgress(0);

    // Store zemachs as JSON string in the lyrics field
    const lyricsJson = JSON.stringify(zemachs.map(z => ({ text: z.text })));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("uploadedById", adminId);
    formData.append("language", language);
    formData.append("lyrics", lyricsJson);
    formData.append("alignment", "LEFT"); // kept for DB compat, display is automatic
    if (language === "GEEZ") {
      formData.append("interpretation", interpretation);
    }
    selectedCategories.forEach(id => formData.append("categoryIds", id));

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        setUploadProgress(Math.round(percentComplete));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setStatus("success");
        setTimeout(() => {
          router.push("/mezmur/music");
          router.refresh();
        }, 1500);
      } else {
        const errorData = JSON.parse(xhr.responseText || "{}");
        setStatus("error");
        setErrorMessage(errorData.error || "Failed to upload file");
      }
      setIsUploading(false);
    });

    xhr.addEventListener("error", () => {
      setStatus("error");
      setErrorMessage("Network error occurred");
      setIsUploading(false);
    });

    xhr.open("POST", "/api/mezmur/music/upload");
    xhr.send(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto animate-fade-in">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">መዝሙር አስገባ</h2>
        <p className="text-sm opacity-50">ወደ መዝገቡ ዐዲስ መዝሙር ወይም ወረብ ጨምር</p>
      </div>

      <div
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer ${
          file ? 'border-emerald-500/50 bg-emerald-500/5' :
          isDragging ? 'border-[hsl(25_70%_45%)] bg-[hsl(25_70%_45%)]/10 scale-[1.01]' :
          'border-[hsl(var(--border))] hover:border-[hsl(25_70%_40%)] hover:bg-[hsl(var(--muted)/0.3)]'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {file ? (
          <div className="flex flex-col items-center animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
              <Music size={24} />
            </div>
            <p className="text-sm font-bold truncate max-w-xs">{file.name}</p>
            <p className="text-[10px] opacity-40 mt-1">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="mt-4 text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
            >
              Change File
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-200 ${
              isDragging ? 'bg-[hsl(25_70%_45%)] text-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
            }`}>
              <Upload size={24} className={isDragging ? 'animate-bounce' : ''} />
            </div>
            <p className="text-sm font-medium">
              {isDragging ? 'Drop to upload' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-[10px] opacity-40 mt-2 font-bold uppercase tracking-wider">MP3, WAV, or M4A (Max 50MB)</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider opacity-60">የመዝሙር ስም</label>
          <input
            className="w-full h-10 rounded-lg border px-4 text-sm transition-all outline-none focus:border-[hsl(25_70%_40%)]"
            style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
            placeholder="የመዝሙር ወይም ወረብ ስም ጻፍ..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider opacity-60">ምድቦች</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                style={{
                  background: selectedCategories.includes(cat.id) ? "hsl(25 70% 45%)" : "hsl(var(--card))",
                  borderColor: selectedCategories.includes(cat.id) ? "hsl(25 70% 50%)" : "hsl(var(--border))",
                  color: selectedCategories.includes(cat.id) ? "#fff" : "hsl(var(--muted-foreground))",
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[hsl(var(--border))] space-y-6">
          {/* Language Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-2">
              <Languages size={14} /> ቋንቋ
            </label>
            <div className="flex p-1 rounded-lg bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))]">
              <button
                type="button"
                onClick={() => setLanguage("AMHARIC")}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${language === "AMHARIC" ? "bg-[hsl(25_70%_45%)] text-white shadow-lg" : "opacity-50"}`}
              >
                ዐማርኛ
              </button>
              <button
                type="button"
                onClick={() => setLanguage("GEEZ")}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${language === "GEEZ" ? "bg-[hsl(25_70%_45%)] text-white shadow-lg" : "opacity-50"}`}
              >
                ግእዝ
              </button>
            </div>
          </div>

          {/* Zemachs (Verses/Parts) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-2">
                <Type size={14} /> የመዝሙር ቃላት ({language === "GEEZ" ? "ግእዝ" : "ዐማርኛ"}) — አዝማቾች
              </label>
            </div>

            <div className="space-y-3">
              {zemachs.map((zemach, index) => {
                const isLeft = index % 2 === 0;
                return (
                  <div key={index} className="relative group">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                        style={{
                          background: isLeft ? "hsl(25 70% 45% / 0.15)" : "hsl(210 70% 45% / 0.15)",
                          color: isLeft ? "hsl(25 70% 50%)" : "hsl(210 70% 55%)"
                        }}
                      >
                        አዝማች {index + 1} · {isLeft ? "← ግራ" : "ቀኝ →"}
                      </span>
                      {zemachs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeZemach(index)}
                          className="p-1 rounded hover:bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          title="ይህንን አዝማች አጥፋ"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <textarea
                      className={`w-full h-36 rounded-lg border px-4 py-3 text-sm transition-all outline-none focus:border-[hsl(25_70%_40%)] resize-none font-amharic ${isLeft ? "text-left" : "text-right"}`}
                      style={{
                        background: "hsl(var(--card))",
                        borderColor: isLeft ? "hsl(25 70% 45% / 0.3)" : "hsl(210 70% 45% / 0.3)"
                      }}
                      placeholder={`አዝማች ${index + 1} ቃላትን ጻፍ...`}
                      value={zemach.text}
                      onChange={(e) => updateZemach(index, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addZemach}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed text-xs font-bold uppercase tracking-wider transition-all opacity-50 hover:opacity-100"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              <Plus size={14} /> አዝማች ጨምር
            </button>
          </div>

          {language === "GEEZ" && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-2 text-emerald-500">
                <Languages size={14} /> ዐማርኛ ትርጉም
              </label>
              <textarea
                className="w-full h-32 rounded-lg border px-4 py-3 text-sm transition-all outline-none focus:border-[hsl(25_70%_40%)] resize-none"
                style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                placeholder="የግእዝ መዝሙሩን ዐማርኛ ትርጉም ጻፉ ..."
                value={interpretation}
                onChange={(e) => setInterpretation(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {isUploading && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest opacity-50">
            <span>Uploading "{file?.name}"</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full bg-[hsl(var(--muted))] rounded-full overflow-hidden border border-[hsl(var(--border))]">
            <div
              className="h-full bg-[hsl(25_70%_45%)] transition-all duration-300 ease-out shadow-[0_0_10px_rgba(234,88,12,0.3)]"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-xs font-medium border border-red-500/20">
          <AlertCircle size={16} />
          {errorMessage}
        </div>
      )}

      {status === "success" && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-medium border border-emerald-500/20">
          <CheckCircle2 size={16} />
          መዝሙራቱ በትክክል ተጭነዋል! Redirecting...
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 rounded-lg text-sm font-bold border transition-all opacity-60 hover:opacity-100"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          ተመለስ
        </button>
        <button
          type="submit"
          disabled={isUploading || !file || !title}
          className="px-8 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-30 flex items-center gap-2"
          style={{ background: "hsl(25 70% 45%)", color: "#fff" }}
        >
          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {isUploading ? "Uploading..." : "Start Upload"}
        </button>
      </div>
    </form>
  );
}
