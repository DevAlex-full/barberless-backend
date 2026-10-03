import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ReportService } from "./report.service";
import { AuthenticateGuard } from "../auth/guards/authenticate.guard";
import { AuthorizeGuard } from "../auth/guards/authorize.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("reports")
@UseGuards(AuthenticateGuard)
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Get("executive")
  @Roles("OWNER")
  async getExecutive(@Query("start") start: string, @Query("end") end: string) {
    return this.reportService.getExecutiveSummary(new Date(start), new Date(end));
  }

  @Get("ltv")
  @Roles("OWNER")
  async getLTV() {
    return this.reportService.getCustomerLTV();
  }
}
