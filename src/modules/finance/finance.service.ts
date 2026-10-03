import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async setCommission(professionalId: string, percentage: number) {
    return this.prisma.commissionConfig.upsert({
      where: { professionalId },
      update: { percentage },
      create: { professionalId, percentage },
    });
  }

  async calculateProduction(professionalId: string, startDate: Date, endDate: Date) {
    const config = await this.prisma.commissionConfig.findUnique({ where: { professionalId } });
    const percentage = config?.percentage || 0;

    const items = await this.prisma.comandaItem.findMany({
      where: {
        professionalId,
        comanda: {
          status: 'CLOSED',
          payments: { some: {} } // Only count if it was actually paid
        },
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    const grossProduction = items.reduce((acc, item) => acc + item.priceAtMoment, 0);
    const commissionValue = Math.floor(grossProduction * percentage);

    return {
      professionalId,
      grossProduction,
      commissionValue,
      netToShop: grossProduction - commissionValue,
      percentage: percentage * 100
    };
  }

  async getShopGlobalFinance(startDate: Date, endDate: Date) {
    const payments = await this.prisma.payment.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } }
    });

    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
    
    const professionals = await this.prisma.professional.findMany();
    let totalCommissions = 0;
    const detailed = [];

    for (const prof of professionals) {
      const prod = await this.calculateProduction(prof.id, startDate, endDate);
      totalCommissions += prod.commissionValue;
      detailed.push({ name: prof.name, ...prod });
    }

    return {
      totalRevenue,
      totalCommissions,
      netProfit: totalRevenue - totalCommissions,
      detailed
    };
  }

  async createPayout(professionalId: string, amount: number, notes?: string) {
    return this.prisma.payout.create({
      data: { professionalId, amount, notes }
    });
  }
}
