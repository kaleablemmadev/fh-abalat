'use client';

import { useState, useEffect } from 'react';
import {
  UserPlus,
  Loader2,
  CheckCircle2,
  Download,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Phone,
  Calendar,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { courseClassTypeDisplayNames } from '../course/constants/courseEnum';
import { jsPDF } from 'jspdf';

export default function PublicRegistrationPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'MALE',
    age: '',
    phoneNumber: '',
    address: '',
    courseClassId: ''
  });
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClasses() {
      const res = await fetch('/api/course/course-classes');
      if (res.ok) {
        const data = await res.json();
        setClasses(data.filter((c: any) => c.isActive));
      }
    }
    fetchClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/public/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          age: Number(formData.age)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessData(data.student);
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!successData) return;

    const doc = new jsPDF();

    // Load Amharic Font
    try {
      const fontUrl = '/fonts/NotoSansEthiopic-VariableFont_wdth,wght.ttf';
      const response = await fetch(fontUrl);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      doc.addFileToVFS('NotoSansEthiopic.ttf', base64);
      doc.addFont('NotoSansEthiopic.ttf', 'NotoSansEthiopic', 'normal');
      doc.setFont('NotoSansEthiopic');
    } catch (err) {
      console.warn("Could not load Amharic font for PDF", err);
    }

    // Header
    doc.setFillColor(30, 41, 59); // Slate 900
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('ፍሬ ሃይማኖት ሰንበት ትምህርት ቤት', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('የተማሪ ምዝገባ ማረጋገጫ (Student Registration Confirmation)', 105, 30, { align: 'center' });

    // Body
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);

    let y = 60;
    const addRow = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 80, y);
      y += 12;
    };

    addRow('ሙሉ ስም (Full Name)', successData.fullName);
    addRow('ክፍል (Class)', `${courseClassTypeDisplayNames[successData.className as keyof typeof courseClassTypeDisplayNames] || successData.className} (${successData.classYear})`);

    // Access ID Highlight
    y += 10;
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.rect(15, y - 10, 180, 30, 'F');
    doc.setDrawColor(59, 130, 246); // Blue 500
    doc.setLineWidth(1);
    doc.line(15, y - 10, 15, y + 20);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('የመግቢያ ኮድ (Access ID):', 25, y + 2);
    doc.setFontSize(24);
    doc.setTextColor(37, 99, 235); // Blue 600
    doc.text(successData.privateId, 25, y + 14);

    y += 40;
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('ይህንን ኮድ በመጠቀም ወደ ሲስተሙ በመግባት ውጤቶንና ሌሎች መረጃዎችን መከታተል ይችላሉ።', 20, y);
    doc.text('Use this code to log in to the portal to track your grades and participation.', 20, y + 6);

    doc.save(`FHC_Registration_${successData.fullName.replace(/\s+/g, '_')}.pdf`);
  };

  if (successData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 animate-fade-in">
          <div className="mx-auto w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white mb-2">ምዝገባው በተሳካ ሁኔታ ተጠናቋል!</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              እንኳን ደህና መጡ! የምዝገባ ኮድዎ ከታች ያለው ነው። እባክዎ ለወደፊት ሲገቡ ስለሚያስፈልጎት ይያዙት።
            </p>
          </div>

          <div className="py-6 bg-slate-950 rounded-2xl border border-blue-500/30 relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">የመግቢያ ኮድ (Entrance ID)</p>
            <p className="text-4xl font-black text-white tracking-tighter">{successData.privateId}</p>
          </div>

          <div className="space-y-3 pt-4">
            <button
              onClick={downloadPDF}
              className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all flex items-center justify-center gap-2 border border-slate-700"
            >
              <Download size={18} />
              የምዝገባ ማረጋገጫ አውርድ (PDF)
            </button>
            <Link
              href="/"
              className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all flex items-center justify-center gap-2"
            >
              ወደ መግቢያ ገጽ ሂድ
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 md:py-12">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold">
        <ChevronLeft size={18} /> ተመለስ
      </Link>

      <div className="w-full max-w-xl space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-4">
            <UserPlus size={32} className="text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            የአባላት ምዝገባ ፎርም
          </h1>
          <p className="text-slate-400 text-sm">
            እባክዎ ትክክለኛ መረጃ በመሙላት ይመዝገቡ
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">ሙሉ ስም (Full Name)</label>
                <input
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  placeholder="ሙሉ ስም ያስገቡ"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">ጾታ (Gender)</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                  >
                    <option value="MALE">ወንድ (Male)</option>
                    <option value="FEMALE">ሴት (Female)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">እድሜ (Age)</label>
                  <input
                    required
                    type="number"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.age}
                    onChange={e => setFormData({...formData, age: e.target.value})}
                    placeholder="እድሜ"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">ስልክ ቁጥር (Phone Number)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.phoneNumber}
                    onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                    placeholder="09..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">አድራሻ (Address)</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="ሰፈር / የቤት ቁጥር"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 text-blue-500">የሚማሩበት ክፍል (Class) *</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-blue-500/30 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.courseClassId}
                  onChange={e => setFormData({...formData, courseClassId: e.target.value})}
                >
                  <option value="">ክፍል ይምረጡ...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {courseClassTypeDisplayNames[c.name as keyof typeof courseClassTypeDisplayNames] || c.name} ({c.year})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !formData.courseClassId}
              className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-30"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <><ShieldCheck size={20} /> ተመዝገብ</>}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-slate-700 font-bold uppercase tracking-[0.2em]">
          Participation Management System
        </p>
      </div>
    </div>
  );
}
