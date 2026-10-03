import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async queueNotification(userId: string, title: string, content: string, type: 'REMINDER' | 'PROMOTION' | 'SYSTEM' | 'LOYALTY') {
    return this.prisma.notification.create({
      data: { userId, title, content, type, status: 'PENDING' }
    });
  }

  async sendReminderNotifications() {
    // This would be called by a Cron Job
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const upcomingBookings = await this.prisma.booking.findMany({
      where: {
        startTime: {
          gte: new Date(),
          lte: tomorrow
        },
        status: 'SCHEDULED'
      },
      include: { customer: { include: { user: true } } }
    });

    const results = [];
    for (const booking of upcomingBookings) {
      if (!booking.customer?.user) continue;
      
      const content = `Olá ${booking.customer.name}, lembramos do seu horário amanhã às ${booking.startTime.toLocaleTimeString()}!`;
      const notif = await this.queueNotification(
        booking.customer.user.id,
        "Lembrete de Agendamento",
        content,
        'REMINDER'
      );
      
      // In a real app, here we would call an external API (SendGrid, Twilio, etc.)
      // For now, we mark as SENT to simulate success.
      await this.prisma.notification.update({
        where: { id: notif.id },
        data: { status: 'SENT', sentAt: new Date() }
      });
      results.push(notif.id);
    }
    return results;
  }

  async getNotificationsForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
