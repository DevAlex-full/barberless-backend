import { Controller, Get, Patch, Delete, Body, Param, UseGuards, ForbiddenException } from "@nestjs/common";
import { AuthenticateGuard } from "../auth/guards/authenticate.guard";
import { PrismaService } from "../prisma/prisma.service";
import { Request } from 'express';

@Controller("me")
@UseGuards(AuthenticateGuard)
export class CustomerPortalController {
  constructor(private prisma: PrismaService) {}

  @Get("profile")
  async getProfile(@Request() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { customer: true }
    });
    if (!user?.customer) throw new ForbiddenException("User is not a customer");
    return user.customer;
  }

  @Patch("profile")
  async updateProfile(@Request() req: any, @Body() body: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { customer: true }
    });
    if (!user?.customer) throw new ForbiddenException("User is not a customer");

    return this.prisma.customer.update({
      where: { id: user.customer.id },
      data: body,
    });
  }

  @Get("bookings")
  async getMyBookings(@Request() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { customer: true }
    });
    if (!user?.customer) throw new ForbiddenException("User is not a customer");

    return this.prisma.booking.findMany({
      where: { customerId: user.customer.id },
      include: { professional: true, service: true },
      orderBy: { startTime: 'desc' }
    });
  }

  @Patch("bookings/:id/cancel")
  async cancelBooking(@Request() req: any, @Param("id") id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { customer: true }
    });
    if (!user?.customer) throw new ForbiddenException("User is not a customer");

    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking || booking.customerId !== user.customer.id) {
      throw new ForbiddenException("Booking not found or does not belong to you");
    }

    // Rule: Can only cancel if it's more than 2 hours from now
    const now = new Date();
    const bookingTime = new Date(booking.startTime);
    const diffInHours = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 2) {
      throw new ForbiddenException("Bookings cannot be cancelled less than 2 hours before the appointment.");
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  }
}
