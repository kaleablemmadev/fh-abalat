// /course/notifications/page.tsx
import prisma from '@/src/lib/prisma';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';
import { Bell, Clock } from 'lucide-react';
import { formatEthiopianDate } from '@/src/lib/ethiopiancal';

export default async function CourseNotificationsPage() {
  const notifications = await prisma.notification.findMany({
    where: { mode: 'COURSE' },
    include: {
      targetUser: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/course' },
          { label: 'Notifications' },
        ]}
      />

      <div className="space-y-4">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          Notifications
        </h1>

        <div className="rounded border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          {notifications.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
              No notifications
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 hover:bg-[hsl(var(--muted)/0.3)] transition-colors ${!notification.isRead ? 'bg-[hsl(var(--muted)/0.2)]' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div
                        className="p-2 rounded-full"
                        style={{
                          background: notification.type === 'AUDIT'
                            ? 'hsl(45 40% 12%)'
                            : notification.type === 'REGISTRATION'
                            ? 'hsl(160 40% 12%)'
                            : 'hsl(var(--muted))',
                          color: notification.type === 'AUDIT'
                            ? 'hsl(45 60% 55%)'
                            : notification.type === 'REGISTRATION'
                            ? 'hsl(160 60% 55%)'
                            : 'hsl(var(--foreground))',
                        }}
                      >
                        <Bell size={16} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 rounded-full" style={{ background: 'hsl(160 70% 45%)' }} />
                        )}
                      </div>
                      <p className="text-sm mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{formatEthiopianDate(new Date(notification.createdAt))}</span>
                        </div>
                        {notification.targetUser && (
                          <span>To: {notification.targetUser.fullName || notification.targetUser.email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
