'use client';

import { useState, useEffect } from 'react';
import { Layers, Plus, BookOpen, Users, Loader2, Edit, Trash2, X } from 'lucide-react';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';

interface Department {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  _count: {
    courses: number;
    instructors: number;
  };
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/course/departments');
      const data = await res.json();
      setDepartments(data);
    } catch (error) {
      console.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (dept: Department) => {
    setEditingDepartmentId(dept.id);
    setFormData({
      name: dept.name,
      code: dept.code || '',
      description: dept.description || ''
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingDepartmentId(null);
    setFormData({ name: '', code: '', description: '' });
    setError(null);
  };

  const handleDeleteDepartment = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete department "${name}"?`)) return;

    try {
      const res = await fetch(`/api/course/departments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        fetchDepartments();
      } else {
        alert(data.error || 'Failed to delete department');
      }
    } catch (error) {
      console.error('Failed to delete department');
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const url = editingDepartmentId
        ? `/api/course/departments/${editingDepartmentId}`
        : '/api/course/departments';
      const method = editingDepartmentId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        handleCancelForm();
        fetchDepartments();
      } else {
        setError(data.error || 'Failed to save department');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Failed to save department');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading departments...</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/course' }, { label: 'Departments' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">Departments</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Organize courses and instructors by academic departments.</p>
        </div>
        <button
          onClick={() => {
            if (showAddForm) handleCancelForm();
            else setShowAddForm(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary)/0.9)] active:scale-95"
        >
          <Plus size={16} />
          {showAddForm ? 'Cancel' : 'New Department'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddDepartment} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-4 animate-slide-in max-w-lg shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-[hsl(var(--foreground))]">{editingDepartmentId ? 'Edit Department' : 'Create New Department'}</h2>
            <button type="button" onClick={handleCancelForm} className="p-1 rounded-full hover:bg-[hsl(var(--muted))]"><X size={16} /></button>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Department Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
              placeholder="e.g., Biblical Studies"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none"
              placeholder="e.g., BS"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none min-h-[80px]"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-xs border border-red-500/20 animate-slide-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full px-6 py-2 rounded-lg text-sm font-bold bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary)/0.9)] disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : editingDepartmentId ? 'Save Changes' : 'Create Department'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((dept) => (
          <div key={dept.id} className="group rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-4 hover:border-[hsl(var(--primary)/0.4)] transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-[hsl(var(--foreground))]">{dept.name}</h3>
                  <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-widest">
                    {dept.code || 'NO-CODE'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEditClick(dept)}
                  className="p-1.5 rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.1)]"
                  title="Edit"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                  className="p-1.5 rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-red-500/10"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {dept.description && (
              <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed line-clamp-2">
                {dept.description}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[hsl(var(--border))]">
              <div className="flex items-center gap-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                <BookOpen size={14} className="text-[hsl(var(--primary))]" />
                <span>{dept._count.courses} Courses</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                <Users size={14} className="text-[hsl(var(--primary))]" />
                <span>{dept._count.instructors} Instructors</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
