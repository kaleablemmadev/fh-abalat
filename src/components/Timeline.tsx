import React from "react";
import { formatEthiopianDate, dateToEthiopian } from "@/src/lib/ethiopiancal";
import {
  Calendar,
  GraduationCap,
  BookOpen,
  Trophy,
  Star,
  Info,
  AlertTriangle
} from "lucide-react";

interface TimelineEvent {
  id: string;
  title: string;
  date: Date;
  description?: string | null;
}

interface TimelineProps {
  events: TimelineEvent[];
}

const getEventIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('exam') || t.includes('test') || t.includes('grade')) return <GraduationCap size={16} />;
  if (t.includes('regist') || t.includes('start') || t.includes('open')) return <Calendar size={16} />;
  if (t.includes('holiday') || t.includes('feast') || t.includes('celebrat')) return <Star size={16} />;
  if (t.includes('symposium') || t.includes('seminar') || t.includes('lecture')) return <BookOpen size={16} />;
  if (t.includes('clos') || t.includes('end') || t.includes('finish')) return <Trophy size={16} />;
  return <Info size={16} />;
};

const getEventColor = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('exam') || t.includes('test')) return 'text-red-500 bg-red-500/10 border-red-500/20';
  if (t.includes('holiday') || t.includes('feast')) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  if (t.includes('regist') || t.includes('start')) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
  if (t.includes('clos') || t.includes('end')) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
  return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
};

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="relative container mx-auto px-4 flex flex-col space-y-12">
      {/* Central Line */}
      <div className="absolute z-0 w-0.5 h-full bg-gradient-to-b from-blue-500/50 via-[hsl(var(--border))] to-transparent left-1/2 transform -translate-x-1/2"></div>

      {sortedEvents.map((event, index) => {
        const isLeft = index % 2 === 0;
        const ethDate = dateToEthiopian(new Date(event.date));
        const colorClasses = getEventColor(event.title);

        return (
          <div key={event.id} className={`relative z-10 flex items-center justify-between w-full ${isLeft ? 'flex-row-reverse' : ''}`}>
            {/* Content Side */}
            <div className="w-[45%]">
              <div className={`p-5 rounded-2xl border border-[hsl(var(--border))] shadow-sm hover:shadow-xl transition-all duration-300 bg-[hsl(var(--card))] group ${isLeft ? 'text-right hover:-translate-x-1' : 'text-left hover:translate-x-1'}`}>
                <div className={`inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full border ${colorClasses} ${isLeft ? 'flex-row-reverse' : ''}`}>
                  {getEventIcon(event.title)}
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                    {formatEthiopianDate(ethDate, 'short')}
                  </span>
                </div>

                <h4 className="text-base font-black text-[hsl(var(--foreground))] group-hover:text-blue-500 transition-colors">{event.title}</h4>

                {event.description && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-3 leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
                    {event.description}
                  </p>
                )}

                <div className={`mt-4 flex items-center gap-2 text-[10px] font-bold opacity-30 group-hover:opacity-100 transition-opacity ${isLeft ? 'justify-end' : ''}`}>
                   <Calendar size={10} />
                   <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Dot on the line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-4 border-[hsl(var(--background))] bg-[hsl(var(--card))] flex items-center justify-center shadow-lg transition-transform hover:scale-125 z-20">
                <div className={`w-3 h-3 rounded-full ${colorClasses.split(' ')[0].replace('text-', 'bg-')} animate-pulse`}></div>
              </div>
            </div>

            {/* Empty Side */}
            <div className="w-[45%]"></div>
          </div>
        );
      })}

      {sortedEvents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="p-4 rounded-full bg-slate-800/50 text-slate-500">
             <AlertTriangle size={32} />
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))] italic max-w-xs">
            No academic milestones have been scheduled for this year yet.
          </p>
        </div>
      )}
    </div>
  );
};
