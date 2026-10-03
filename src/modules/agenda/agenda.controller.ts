import { Controller, Get, Post, Patch, Body, Query, Param, UseGuards } from "@nestjs/common";
import { AgendaService } from "./agenda.service";
import { AuthenticateGuard } from "../auth/guards/authenticate.guard";
import { AuthorizeGuard } from "../auth/guards/authorize.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("agenda")
@UseGuards(AuthenticateGuard)
export class AgendaController {
  constructor(private agendaService: AgendaService) {}

  @Get("slots")
  @Roles("OWNER", "RECEPTIONIST", "BARBER")
  async getSlots(@Query("professionalId") professionalId: string, @Query("date") dateStr: string, @Query("serviceId") serviceId: string) {
    return this.agendaService.getAvailableSlots(professionalId, new Date(dateStr), serviceId);
  }

  @Post("bookings")
  @Roles("OWNER", "RECEPTIONIST")
  async book(@Body() body: any) {
    return this.agendaService.createBooking({
      customerId: body.customerId,
      professionalId: body.professionalId,
      serviceId: body.serviceId,
      startTime: new Date(body.startTime),
      notes: body.notes,
    });
  }

  @Patch("bookings/:id/status")
  @Roles("OWNER", "RECEPTIONIST")
  async updateStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.agendaService.updateBookingStatus(id, status);
  }
}
