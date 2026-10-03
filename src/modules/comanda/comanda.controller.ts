import { Controller, Get, Post, Patch, Body, Param, UseGuards } from "@nestjs/common";
import { ComandaService } from "./comanda.service";
import { AuthenticateGuard } from "../auth/guards/authenticate.guard";
import { AuthorizeGuard } from "../auth/guards/authorize.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("comandas")
@UseGuards(AuthenticateGuard)
export class ComandaController {
  constructor(private comandaService: ComandaService) {}

  @Post("open")
  @Roles("OWNER", "RECEPTIONIST")
  async open(@Body() body: { customerId: string, bookingId?: string }) {
    return this.comandaService.openComanda(body.customerId, body.bookingId);
  }

  @Post(":id/items")
  @Roles("OWNER", "RECEPTIONIST", "BARBER")
  async addItem(@Param("id") id: string, @Body() body: { serviceId: string, professionalId: string }) {
    return this.comandaService.addItem(id, {
      serviceId: body.serviceId,
      professionalId: body.professionalId,
      priceAtMoment: 0 // Service calculates this
    });
  }

  @Patch(":id/close")
  @Roles("OWNER", "RECEPTIONIST")
  async close(@Param("id") id: string) {
    return this.comandaService.closeComanda(id);
  }

  @Get("open")
  @Roles("OWNER", "RECEPTIONIST")
  async listOpen() {
    return this.comandaService.listOpenComandas();
  }
}
