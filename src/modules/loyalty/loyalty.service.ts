import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { nanoid } from "nanoid";

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  async ensureProfile(customerId: string) {
    return this.prisma.loyaltyProfile.upsert({
      where: { customerId },
      update: {},
      create: {
        customerId,
        referralCode: nanoid(8).toUpperCase(),
      },
    });
  }

  async addPoints(customerId: string, amountCents: number) {
    const pointsEarned = Math.floor(amountCents / 10);
    await this.ensureProfile(customerId);
    return this.prisma.loyaltyProfile.update({
      where: { customerId },
      data: { points: { increment: pointsEarned } },
    });
  }

  async processReferral(referralCode: string, referredCustomerId: string) {
    const referrer = await this.prisma.loyaltyProfile.findUnique({
      where: { referralCode }
    });
    if (!referrer) return null;
    await this.prisma.loyaltyProfile.update({
      where: { id: referrer.id },
      data: { points: { increment: 500 } }
    });
    return this.prisma.referral.create({
      data: { referrerId: referrer.id, referredCustomerId }
    });
  }

  async getCustomerLoyalty(customerId: string) {
    return this.prisma.loyaltyProfile.findUnique({ where: { customerId } });
  }
}
