import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { addDays } from "date-fns";

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  async createPackage(data: { name: string, price: number, serviceId: string, quantity: number, validityDays: number }) {
    return this.prisma.package.create({ data });
  }

  async buyPackage(customerId: string, packageId: string) {
    const pkg = await this.prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) throw new NotFoundException("Package not found");

    const endDate = addDays(new Date(), pkg.validityDays);

    return this.prisma.subscription.create({
      data: {
        customerId,
        packageId,
        credits: pkg.quantity,
        endDate,
      },
    });
  }

  async useCredit(customerId: string, serviceId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: {
        customerId,
        status: 'ACTIVE',
        credits: { gt: 0 },
        endDate: { gte: new Date() },
        package: { serviceId }
      },
      orderBy: { endDate: 'asc' }
    });

    if (!sub) throw new BadRequestException("No active package credits available for this service");

    return this.prisma.subscription.update({
      where: { id: sub.id },
      data: { credits: { decrement: 1 } }
    });
  }

  async getCustomerSubscriptions(customerId: string) {
    return this.prisma.subscription.findMany({
      where: { customerId },
      include: { package: true },
      orderBy: { startDate: 'desc' }
    });
  }
}
