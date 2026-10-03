import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { LoyaltyService } from "./loyalty.service";
import { AuthenticateGuard } from "../auth/guards/authenticate.guard";
import { PrismaService } from "../prisma/prisma.service";
import { Request } from 'express';

@Controller("loyalty")
@UseGuards(AuthenticateGuard)
export class LoyaltyController {
  constructor(private loyaltyService: LoyaltyService, private prisma: PrismaService) {}

  @Get("me")
  async getMe(@Request() req: any) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id }, include: { customer: true } });
    if (!user?.customer) return null;
    return this.loyaltyService.getCustomerLoyalty(user.customer.id);
  }

  @Post("refer")
  async refer(@Body() body: { code: string }, @Request() req: any) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id }, include: { customer: true } });
    if (!user?.customer) return null;
    return this.loyaltyService.processReferral(body.code, user.customer.id);
  }
}
