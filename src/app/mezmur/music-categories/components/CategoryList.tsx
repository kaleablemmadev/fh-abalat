"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Loader2, ListMusic, CheckCircle2, Edit, Save, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface CategoryListProps {
  initialCategories: Category[];
}

export default function CategoryList({ initialCategories }: CategoryListProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsAdding(true);
    try {
      const res = await fetch("/api/mezmur/music-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc }),
      });

      if (!res.ok) throw new Error("Failed to add");

      const category = await res.json();
      setCategories([...categories, category]);
      setNewName("");
      setNewDesc("");
    } catch (err) {
      alert("Error adding category");
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/mezmur/music-categories/${editingCategory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingCategory.name,
          description: editingCategory.description
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      const updated = await res.json();
      setCategories(categories.map(c => c.id === updated.id ? updated : c));
      setEditingCategory(null);
    } catch (err) {
      alert("Error updating category");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will not delete the songs, just the category link.")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/mezmur/music-categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setCategories(categories.filter(c => c.id !== id));
    } catch (err) {
      alert("Error deleting category");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-xl border border-[hsl(var(--border))]" style={{ background: "hsl(var(--card))" }}>
          <div className="p-4 border-b border-[hsl(var(--border))] flex items-center gap-2">
            <ListMusic size={18} className="opacity-50" />
            <h3 className="font-bold text-sm uppercase tracking-wider">ያሉ የመዝሙር ምድቦች</h3>
          </div>
          <div className="divide-y divide-[hsl(var(--border))]">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 flex items-center justify-between group">
                <Link href={`/mezmur/music-categories/${cat.id}`} className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm group-hover:text-[hsl(25_70%_45%)] transition-colors">{cat.name}</h4>
                  <p className="text-xs opacity-50 mt-0.5">{cat.description || "No description"}</p>
                </Link>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => setEditingCategory(cat)}
                    className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-500 transition-all"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    disabled={!!deletingId}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-all"
                  >
                    {deletingId === cat.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="p-12 text-center opacity-30 text-sm italic">ምንም ምድቦች የሉም</div>
            )}
          </div>
        </div>
      </div>

      {/* Add Form */}
      <div className="space-y-4">
        <form onSubmit={handleAdd} className="rounded-xl border border-[hsl(var(--border))] p-6 sticky top-20" style={{ background: "hsl(var(--card))" }}>
          <h3 className="font-bold text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
            <Plus size={16} /> ምድብ ጨምር
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">ስም</label>
              <input
                className="w-full h-9 rounded-lg border px-3 text-sm transition-all outline-none focus:border-[hsl(25_70%_40%)]"
                style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
                placeholder="ምሳሌ... ሚያዚያ 23 ወረብ፣ ሐምሌ 26፣ ወዘተ..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">ማብራሪያ</label>
              <textarea
                className="w-full h-24 rounded-lg border px-3 py-2 text-sm transition-all outline-none focus:border-[hsl(25_70%_40%)] resize-none"
                style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
                placeholder="አጭር ማብራሪያ..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isAdding || !newName.trim()}
              className="w-full h-10 rounded-lg bg-[hsl(25_70%_45%)] hover:bg-[hsl(25_70%_40%)] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              ምድቡን መዝግብ
            </button>
          </div>
        </form>
      </div>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-md rounded-2xl border border-[hsl(var(--border))] p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            style={{ background: "hsl(var(--card))" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                <Edit size={16} /> ምድብ አስተካክል
              </h3>
              <button onClick={() => setEditingCategory(null)} className="opacity-50 hover:opacity-100 transition-opacity">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Name</label>
                <input
                  className="w-full h-10 rounded-lg border px-4 text-sm transition-all outline-none focus:border-[hsl(25_70%_40%)]"
                  style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Description</label>
                <textarea
                  className="w-full h-32 rounded-lg border px-4 py-2 text-sm transition-all outline-none focus:border-[hsl(25_70%_40%)] resize-none"
                  style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
                  value={editingCategory.description || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 text-sm font-medium opacity-50 hover:opacity-100"
                >
                  ተመለስ
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !editingCategory.name.trim()}
                  className="px-8 py-2 rounded-lg bg-[hsl(25_70%_45%)] hover:bg-[hsl(25_70%_40%)] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all"
                >
                  {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
