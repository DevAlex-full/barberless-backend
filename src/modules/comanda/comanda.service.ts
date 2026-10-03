import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

export interface ComandaItem {
  serviceId: string;
  professionalId: string;
  priceAtMoment: number;
}

@Injectable()
export class ComandaService {
  constructor(private prisma: PrismaService) {}

  async openComanda(customerId: string, bookingId?: string) {
    // If there's a booking, we mark it as 'CONFIRMED' (checked-in)
    if (bookingId) {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' }
      });
    }

    return this.prisma.comanda.create({
      data: {
        customerId,
        status: 'OPEN',
        startTime: new Date(),
      },
    });
  }

  async addItem(comandaId: string, item: ComandaItem) {
    const service = await this.prisma.service.findUnique({ where: { id: item.serviceId } });
    if (!service) throw new NotFoundException("Service not found");

    return this.prisma.comandaItem.create({
      data: {
        comandaId,
        serviceId: item.serviceId,
        professionalId: item.professionalId,
        priceAtMoment: service.price, // Freeze price at the moment of service
      },
    });
  }

  async closeComanda(comandaId: string) {
    const comanda = await this.prisma.comanda.findUnique({
      where: { id: comandaId },
      include: { items: true }
    });

    if (!comanda) throw new NotFoundException("Comanda not found");
    if (comanda.status !== 'OPEN') throw new BadRequestException("Comanda is already closed");

    const total = comanda.items.reduce((acc, item) => acc + item.priceAtMoment, 0);

    return this.prisma.comanda.update({
      where: { id: comandaId },
      data: {
        status: 'CLOSED',
        endTime: new Date(),
        totalValue: total,
      },
    });
  }

  async listOpenComandas() {
    return this.prisma.comanda.findMany({
      where: { status: 'OPEN' },
      include: { customer: true, items: { include: { service: true, professional: true } } },
      orderBy: { startTime: 'asc' }
    });
  }
}
