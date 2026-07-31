// /member/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { User, Mail, Phone, Calendar, Shield, Hash, MapPin } from 'lucide-react';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';

export default function MemberProfilePage() {
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('mode_session='));

    if (sessionCookie) {
      const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      fetchProfile(session.userId);
    }
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/abalat/members/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setMember(data);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading profile...</div>;
  if (!member) return <div className="p-12 text-center text-red-500">Profile not found</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/member' },
          { label: 'My Profile' },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <p className="text-sm text-slate-400">Manage your personal information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-4 shadow-sm">
            <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto border-4 border-slate-800">
              <User size={48} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{member.fullName}</h2>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">
                {member.memberType?.replace('_', ' ') || 'Member'}
              </p>
            </div>
            <div className="pt-4 flex justify-center gap-2">
               <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-full border border-emerald-500/20">
                 ACTIVE
               </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-sm">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Registration Details</h3>
             <div className="space-y-3">
               <div className="flex items-center gap-3 text-sm">
                 <Calendar size={14} className="text-slate-500" />
                 <span className="text-slate-400">Joined:</span>
                 <span className="text-slate-200 ml-auto">{member.registerDate || 'N/A'}</span>
               </div>
               <div className="flex items-center gap-3 text-sm">
                 <Shield size={14} className="text-slate-500" />
                 <span className="text-slate-400">Type:</span>
                 <span className="text-slate-200 ml-auto">{member.type}</span>
               </div>
             </div>
          </div>
        </div>

        {/* Details Area */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Personal Information</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <User size={10} /> Full Name
                </label>
                <p className="text-sm text-slate-200 font-medium">{member.fullName}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Shield size={10} /> Christian Name
                </label>
                <p className="text-sm text-slate-200 font-medium">{member.christianName || 'Not set'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Mail size={10} /> Email Address
                </label>
                <p className="text-sm text-slate-200 font-medium">{member.email || 'Not set'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Phone size={10} /> Phone Number
                </label>
                <p className="text-sm text-slate-200 font-medium">{member.phoneNumber || 'Not set'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Hash size={10} /> Age
                </label>
                <p className="text-sm text-slate-200 font-medium">{member.age || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin size={10} /> Address
                </label>
                <p className="text-sm text-slate-200 font-medium">{member.address || 'Not set'}</p>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-800/20 border-t border-slate-800">
               <p className="text-[10px] text-slate-500">
                 Note: If any of your information is incorrect, please contact your administrator to update it.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
