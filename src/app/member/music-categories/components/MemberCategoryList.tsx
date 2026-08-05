"use client";

import { useState } from "react";
import { ListMusic, Music, ChevronDown, ChevronUp, Languages, Play } from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  description: string | null;
  musicFiles: {
    id: string;
    title: string;
    language: "GEEZ" | "AMHARIC";
  }[];
}

interface MemberCategoryListProps {
  categories: Category[];
}

export default function MemberCategoryList({ categories }: MemberCategoryListProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category) => {
        const isExpanded = expandedCategories.has(category.id);
        const fileCount = category.musicFiles.length;

        return (
          <div
            key={category.id}
            className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl overflow-hidden shadow-sm"
          >
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full p-4 flex items-start justify-between hover:bg-[hsl(var(--muted)/0.3)] transition-colors"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-[hsl(25 70% 45%)]/10 text-[hsl(25 70% 45%)] shrink-0">
                  <ListMusic size={18} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="font-bold text-sm truncate" style={{ color: "hsl(var(--foreground))" }}>
                    {category.name}
                  </h3>
                  <p className="text-xs opacity-50 mt-1">
                    {category.description || "No description"}
                  </p>
                  <p className="text-[10px] opacity-40 mt-2">
                    {fileCount} song{fileCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {fileCount > 0 && (
                  <Link
                    href={`/member/music/player?categoryId=${category.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-lg bg-[hsl(25 70% 45%)] text-white hover:bg-[hsl(25 70% 40%)] transition-colors shadow-sm"
                    title="Play Category"
                  >
                    <Play size={14} fill="currentColor" />
                  </Link>
                )}
                <div className="shrink-0 ml-2">
                  {isExpanded ? <ChevronUp size={16} className="opacity-50" /> : <ChevronDown size={16} className="opacity-50" />}
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-[hsl(var(--border))] p-3 space-y-2 max-h-64 overflow-y-auto">
                {category.musicFiles.length === 0 ? (
                  <p className="text-xs opacity-40 text-center py-4">No songs in this category</p>
                ) : (
                  category.musicFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))]"
                    >
                      <Music size={14} className="opacity-50 shrink-0" />
                      <span className="text-sm truncate flex-1" style={{ color: "hsl(var(--foreground))" }}>
                        {file.title}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Languages size={12} className="opacity-40" />
                        <span className="text-[10px] opacity-50">
                          {file.language === "GEEZ" ? "ግዕዝ" : "ዐማርኛ"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}

      {categories.length === 0 && (
        <div className="col-span-full text-center py-12">
          <ListMusic size={48} className="mx-auto opacity-20 mb-4" />
          <p className="text-sm opacity-50">ምንም ምድቦች አልተገኙም</p>
        </div>
      )}
    </div>
  );
}
