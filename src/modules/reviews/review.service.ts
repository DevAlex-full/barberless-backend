import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async createReview(customerId: string, data: { bookingId: string, rating: number, comment?: string }) {
    const booking = await this.prisma.booking.findUnique({ 
      where: { id: data.bookingId },
      include: { customer: true }
    });

    if (!booking) throw new NotFoundException("Booking not found");
    if (booking.customerId !== customerId) throw new ForbiddenException("This booking does not belong to you");
    if (booking.status !== 'COMPLETED') throw new BadRequestException("You can only review completed services");
    
    const existing = await this.prisma.review.findUnique({ where: { bookingId: data.bookingId } });
    if (existing) throw new BadRequestException("You have already reviewed this service");

    return this.prisma.review.create({
      data: {
        bookingId: data.bookingId,
        customerId,
        professionalId: booking.professionalId,
        rating: data.rating,
        comment: data.comment,
      }
    });
  }

  async getProfessionalRating(professionalId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { professionalId, isApproved: true }
    });
    if (!reviews.length) return { average: 0, count: 0 };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return { average: (sum / reviews.length).toFixed(1), count: reviews.length };
  }

  async getApprovedReviews() {
    return this.prisma.review.findMany({
      where: { isApproved: true },
      include: { customer: { select: { name: true } }, professional: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  }

  async approveReview(id: string) {
    return this.prisma.review.update({
      where: { id },
      data: { isApproved: true }
    });
  }
}
