import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { AuthenticateGuard } from "../auth/guards/authenticate.guard";
import { AuthorizeGuard } from "../auth/guards/authorize.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Request } from 'express';

@Controller("notifications")
@UseGuards(AuthenticateGuard)
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get("me")
  async getMyNotifications(@Request() req: any) {
    return this.notificationService.getNotificationsForUser(req.user.id);
  }

  @Post("send-reminders")
  @Roles("OWNER")
  async triggerReminders() {
    return this.notificationService.sendReminderNotifications();
  }

  @Post("marketing")
  @Roles("OWNER")
  async sendMarketing(@Body() body: { userId: string, title: string, content: string }) {
    return this.notificationService.queueNotification(body.userId, body.title, body.content, 'PROMOTION');
  }
}
