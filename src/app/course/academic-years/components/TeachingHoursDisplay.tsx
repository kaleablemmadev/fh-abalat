"use client";

import { useState, useEffect } from "react";
import { Clock, TrendingUp, Loader2 } from "lucide-react";

interface TeachingHoursData {
  firstSemester: {
    availableHours: number;
    requiredHours: number;
    freeHours: number;
  };
  secondSemester: {
    availableHours: number;
    requiredHours: number;
    freeHours: number;
  };
  total: {
    availableHours: number;
    requiredHours: number;
    freeHours: number;
  };
}

interface TeachingHoursDisplayProps {
  academicYearId: string;
}

export default function TeachingHoursDisplay({ academicYearId }: TeachingHoursDisplayProps) {
  const [hoursData, setHoursData] = useState<TeachingHoursData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHoursData();
  }, [academicYearId]);

  const loadHoursData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/course/teaching-hours/${academicYearId}`);
      if (res.ok) {
        const data = await res.json();
        setHoursData(data);
      } else {
        setError("Failed to load teaching hours");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load teaching hours");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
        <Loader2 size={14} className="animate-spin" />
        Loading hours...
      </div>
    );
  }

  if (error || !hoursData) {
    return (
      <div className="text-sm text-red-500">
        {error || "Hours data unavailable"}
      </div>
    );
  }

  const HoursCard = ({ title, data }: { title: string; data: any }) => (
    <div className="space-y-2">
      <h4 className="text-xs font-bold uppercase text-[hsl(var(--muted-foreground))]">{title}</h4>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-[hsl(var(--background))] rounded-lg">
          <p className="text-[10px] uppercase opacity-50">Available</p>
          <p className="text-sm font-bold text-blue-600">{data.availableHours}h</p>
        </div>
        <div className="text-center p-2 bg-[hsl(var(--background))] rounded-lg">
          <p className="text-[10px] uppercase opacity-50">Required</p>
          <p className="text-sm font-bold text-orange-600">{data.requiredHours}h</p>
        </div>
        <div className="text-center p-2 bg-[hsl(var(--background))] rounded-lg">
          <p className="text-[10px] uppercase opacity-50">Free</p>
          <p className="text-sm font-bold text-emerald-600">{data.freeHours}h</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-[hsl(var(--muted-foreground))]" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
          Teaching Hours
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HoursCard title="First Semester" data={hoursData.firstSemester} />
        <HoursCard title="Second Semester" data={hoursData.secondSemester} />
        <HoursCard title="Total Year" data={hoursData.total} />
      </div>

      {hoursData.total.freeHours < 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <TrendingUp size={16} className="text-red-600" />
          <p className="text-sm text-red-600 font-medium">
            Warning: {Math.abs(hoursData.total.freeHours)} hours over capacity
          </p>
        </div>
      )}
    </div>
  );
}
