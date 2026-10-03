import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async getExecutiveSummary(startDate: Date, endDate: Date) {
    // 1. Revenue and Profit (linking to Finance)
    const payments = await this.prisma.payment.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } }
    });
    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

    // 2. Customer Acquisition & Growth
    const newCustomers = await this.prisma.customer.count({
      where: { createdAt: { gte: startDate, lte: endDate } }
    });

    // 3. Operational Volume
    const totalBookings = await this.prisma.booking.count({
      where: { startTime: { gte: startDate, lte: endDate } }
    });

    const completedBookings = await this.prisma.booking.count({
      where: { 
        startTime: { gte: startDate, lte: endDate },
        status: 'COMPLETED'
      }
    });

    // 4. Most Requested Services
    const serviceStats = await this.prisma.comandaItem.groupBy({
      by: ['serviceId'],
      _count: { id: true },
      _sum: { priceAtMoment: true },
      orderBy: { _count: { _desc: true } },
      take: 5
    });

    const serviceDetails = await Promise.all(
      serviceStats.map(async (s) => {
        const service = await this.prisma.service.findUnique({ where: { id: s.serviceId } });
        return { name: service?.name, count: s._count.id, revenue: s._sum.priceAtMoment };
      })
    );

    return {
      kpis: {
        totalRevenue,
        newCustomers,
        totalBookings,
        completionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0
      },
      topServices: serviceDetails
    };
  }

  async getCustomerLTV() {
    const customers = await this.prisma.customer.findMany({
      include: {
        comandas: {
          include: { payments: true }
        }
      }
    });

    const ltv = customers.map(c => {
      const totalSpent = c.comandas.reduce((acc, comanda) => {
        return acc + comanda.payments.reduce((pAcc, p) => pAcc + p.amount, 0);
      }, 0);
      return { name: c.name, totalSpent };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

    return ltv;
  }
}
