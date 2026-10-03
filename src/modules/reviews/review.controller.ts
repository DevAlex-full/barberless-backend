import { Controller, Get, Post, Patch, Body, Param, UseGuards } from "@nestjs/common";
import { ReviewService } from "./review.service";
import { AuthenticateGuard } from "../auth/guards/authenticate.guard";
import { AuthorizeGuard } from "../auth/guards/authorize.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Request } from 'express';
import { PrismaService } from "../prisma/prisma.service";

@Controller("reviews")
@UseGuards(AuthenticateGuard)
export class ReviewController {
  constructor(private reviewService: ReviewService, private prisma: PrismaService) {}

  @Post("me")
  async review(@Request() req: any, @Body() body: any) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id }, include: { customer: true } });
    if (!user?.customer) throw new ForbiddenException("User is not a customer");
    return this.reviewService.createReview(user.customer.id, body);
  }

  @Get("public")
  async getPublic() {
    return this.reviewService.getApprovedReviews();
  }

  @Patch(":id/approve")
  @Roles("OWNER")
  async approve(@Param("id") id: string) {
    return this.reviewService.approveReview(id);
  }
}
