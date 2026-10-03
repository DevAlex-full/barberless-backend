import { Controller, Get, Post, Body, Query, UseGuards } from "@nestjs/common";
import { FinanceService } from "./finance.service";
import { AuthenticateGuard } from "../auth/guards/authenticate.guard";
import { AuthorizeGuard } from "../auth/guards/authorize.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("finance")
@UseGuards(AuthenticateGuard)
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  @Post("commission")
  @Roles("OWNER")
  async setCommission(@Body() body: { professionalId: string, percentage: number }) {
    return this.financeService.setCommission(body.professionalId, body.percentage);
  }

  @Get("report")
  @Roles("OWNER")
  async getReport(@Query("start") start: string, @Query("end") end: string) {
    return this.financeService.getShopGlobalFinance(new Date(start), new Date(end));
  }

  @Post("payout")
  @Roles("OWNER")
  async payout(@Body() body: { professionalId: string, amount: number, notes?: string }) {
    return this.financeService.createPayout(body.professionalId, body.amount, body.notes);
  }
}
