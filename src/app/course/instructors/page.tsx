'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Mail, Phone, Layers, Loader2, ArrowLeft, Edit, Trash2, X } from 'lucide-react';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';
import { useRouter } from 'next/navigation';

interface Instructor {
  id: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  department: { id: string; name: string };
  _count: { courses: number };
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingInstructorId, setEditingInstructorId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    departmentId: ''
  });

  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [instRes, deptRes] = await Promise.all([
        fetch('/api/course/instructors'),
        fetch('/api/course/departments')
      ]);
      const instData = await instRes.json();
      const deptData = await deptRes.json();
      setInstructors(instData);
      setDepartments(deptData);
    } catch (error) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (instructor: Instructor) => {
    setEditingInstructorId(instructor.id);
    setFormData({
      fullName: instructor.fullName,
      email: instructor.email || '',
      phoneNumber: instructor.phoneNumber || '',
      departmentId: instructor.department.id
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteInstructor = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete instructor "${name}"?`)) return;

    try {
      const res = await fetch(`/api/course/instructors/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        fetchData();
      } else {
        alert(data.error || 'Failed to delete instructor');
      }
    } catch (error) {
      console.error('Failed to delete instructor');
    }
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingInstructorId(null);
    setFormData({ fullName: '', email: '', phoneNumber: '', departmentId: '' });
    setError(null);
  };

  const handleAddInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const url = editingInstructorId
        ? `/api/course/instructors/${editingInstructorId}`
        : '/api/course/instructors';
      const method = editingInstructorId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        handleCancelForm();
        fetchData();
      } else {
        setError(data.error || 'Failed to save instructor');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Failed to save instructor');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading instructors...</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/course' }, { label: 'Instructors' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">Instructors</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage academic staff and their department assignments.</p>
        </div>
        <button
          onClick={() => {
            if (showAddForm) handleCancelForm();
            else setShowAddForm(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary)/0.9)] active:scale-95"
        >
          <UserPlus size={16} />
          {showAddForm ? 'Cancel' : 'New Instructor'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddInstructor} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-4 animate-slide-in max-w-2xl shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-[hsl(var(--foreground))]">{editingInstructorId ? 'Edit Instructor' : 'Register New Instructor'}</h2>
            <button type="button" onClick={handleCancelForm} className="p-1 rounded-full hover:bg-[hsl(var(--muted))]"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Full Name *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Department *</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none"
                required
              >
                <option value="">Select Dept...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Phone</label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-xs border border-red-500/20 animate-slide-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2 rounded-lg text-sm font-bold bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary)/0.9)] disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : editingInstructorId ? 'Save Changes' : 'Register Instructor'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instructors.map((inst) => (
          <div key={inst.id} className="group rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 space-y-4 hover:border-[hsl(var(--primary)/0.4)] transition-all">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-[hsl(var(--foreground))] truncate" title={inst.fullName}>{inst.fullName}</h3>
                <span className="inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                  {inst.department.name}
                </span>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-[10px] font-bold text-[hsl(var(--muted-foreground))]">
                  {inst._count.courses} Courses
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditClick(inst)}
                    className="p-1.5 rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.1)]"
                    title="Edit"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteInstructor(inst.id, inst.fullName)}
                    className="p-1.5 rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-red-500/10"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-[hsl(var(--border))]">
              {inst.email && (
                <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                  <Mail size={12} className="text-[hsl(var(--primary))]" />
                  <span>{inst.email}</span>
                </div>
              )}
              {inst.phoneNumber && (
                <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                  <Phone size={12} className="text-[hsl(var(--primary))]" />
                  <span>{inst.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
