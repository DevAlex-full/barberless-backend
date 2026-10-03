import { Controller, Delete, Get, UseGuards, ForbiddenException } from "@nestjs/common";
import { AuthenticateGuard } from "../auth/guards/authenticate.guard";
import { PrismaService } from "../prisma/prisma.service";
import { Request } from 'express';

@Controller("lgpd")
@UseGuards(AuthenticateGuard)
export class LgpdController {
  constructor(private prisma: PrismaService) {}

  @Get("export")
  async exportData(@Request() req: any) {
    const userId = req.user.id;
    const data = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { 
        customer: { 
          include: { 
            bookings: true, 
            comandas: true, 
            loyaltyProfile: true 
          } 
        },
        notifications: true
      }
    });
    return data;
  }

  @Delete("forget-me")
  async forgetMe(@Request() req: any) {
    const userId = req.user.id;
    
    // LGPD: Deletion of personal data. 
    // We maintain financial records (Payments) but anonymize the User/Customer.
    
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { customer: true } });
    if (!user?.customer) throw new ForbiddenException("Customer profile not found");

    await this.prisma.customer.update({
      where: { id: user.customer.id },
      data: {
        name: "Anonymized User",
        email: `deleted-${userId}@barberless.com`,
        phone: "00000000000"
      }
    });

    return this.prisma.user.delete({ where: { id: userId } });
  }
}
