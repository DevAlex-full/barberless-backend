import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { SubscriptionService } from "./subscription.service";
import { AuthenticateGuard } from "../auth/guards/authenticate.guard";
import { AuthorizeGuard } from "../auth/guards/authorize.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Request } from 'express';

@Controller("subscriptions")
@UseGuards(AuthenticateGuard)
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService, private prisma: PrismaService) {}

  @Post("packages")
  @Roles("OWNER")
  async createPackage(@Body() body: any) {
    return this.subscriptionService.createPackage(body);
  }

  @Post("buy")
  async buy(@Request() req: any, @Body() body: { packageId: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id }, include: { customer: true } });
    return this.subscriptionService.buyPackage(user.customer.id, body.packageId);
  }

  @Get("me")
  async getMe(@Request() req: any) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id }, include: { customer: true } });
    return this.subscriptionService.getCustomerSubscriptions(user.customer.id);
  }

  @Post("use-credit")
  async useCredit(@Request() req: any, @Body() body: { serviceId: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id }, include: { customer: true } });
    return this.subscriptionService.useCredit(user.customer.id, body.serviceId);
  }
}
