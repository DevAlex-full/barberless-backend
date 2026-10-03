import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async processPayment(comandaId: string, paymentData: { amount: number, method: string, transactionId?: string }) {
    const comanda = await this.prisma.comanda.findUnique({ 
      where: { id: comandaId } 
    });

    if (!comanda) throw new NotFoundException("Comanda not found");
    if (comanda.status !== 'CLOSED') throw new BadRequestException("Comanda must be CLOSED before payment");

    // Check if already paid
    const existingPayment = await this.prisma.payment.findFirst({ where: { comandaId } });
    if (existingPayment) throw new BadRequestException("This comanda has already been paid");

    return this.prisma.payment.create({
      data: {
        comandaId,
        amount: paymentData.amount,
        method: paymentData.method,
        transactionId: paymentData.transactionId
      }
    });
  }

  async getDailyRevenue(date: Date) {
    const start = new Date(date.setHours(0,0,0,0));
    const end = new Date(date.setHours(23,59,59,999));

    const payments = await this.prisma.payment.findMany({
      where: { createdAt: { gte: start, lte: end } }
    });

    return {
      total: payments.reduce((acc, p) => acc + p.amount, 0),
      count: payments.length,
      methods: payments.reduce((acc: any, p) => {
        acc[p.method] = (acc[p.method] || 0) + p.amount;
        return acc;
      }, {})
    };
  }
}
