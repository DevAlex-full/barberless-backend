import { Controller, Post, Get, Body, Param, UseGuards } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { AuthenticateGuard } from "../auth/guards/authenticate.guard";
import { AuthorizeGuard } from "../auth/guards/authorize.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("payments")
@UseGuards(AuthenticateGuard)
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post("process")
  @Roles("OWNER", "RECEPTIONIST")
  async pay(@Body() body: { comandaId: string, amount: number, method: string, transactionId?: string }) {
    return this.paymentService.processPayment(body.comandaId, body);
  }

  @Get("revenue/today")
  @Roles("OWNER")
  async getToday() {
    return this.paymentService.getDailyRevenue(new Date());
  }
}
