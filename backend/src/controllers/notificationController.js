import { prisma } from '../db.js';

export async function myNotifications(req, res) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 30
  });
  const unreadCount = notifications.filter(item => !item.read).length;
  res.json({ notifications, unreadCount });
}

export async function markNotificationsRead(req, res) {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data: { read: true }
  });
  res.json({ ok: true });
}
