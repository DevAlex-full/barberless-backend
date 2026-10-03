import { Controller, Get, Post, Body, Query, NotFoundException, ConflictException } from "@nestjs/common";
import { AgendaService } from "./agenda.service";
import { PrismaService } from "../prisma/prisma.service";

@Controller("public/agenda")
export class PublicAgendaController {
  constructor(private agendaService: AgendaService, private prisma: PrismaService) {}

  @Get("slots")
  async getSlots(@Query("professionalId") professionalId: string, @Query("date") dateStr: string, @Query("serviceId") serviceId: string) {
    // Public access to slot discovery
    return this.agendaService.getAvailableSlots(professionalId, new Date(dateStr), serviceId);
  }

  @Post("bookings")
  async createPublicBooking(@Body() body: any) {
    // Public booking flow: 
    // 1. Find or Create Customer based on email/phone (Simplified for now)
    // 2. Create the booking
    
    const { email, phone, name, professionalId, serviceId, startTime, notes } = body;

    let customer = await this.prisma.customer.findFirst({
      where: { email }
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: { name, email, phone }
      });
    }

    return this.agendaService.createBooking({
      customerId: customer.id,
      professionalId,
      serviceId,
      startTime: new Date(startTime),
      notes,
    });
  }

  @Get("professionals")
  async getProfessionals() {
    return this.prisma.professional.findMany({
      where: { isActive: true },
      select: { id: true, name: true, specialty: true, photoUrl: true }
    });
  }

  @Get("services")
  async getServices() {
    return this.prisma.service.findMany({
      select: { id: true, name: true, price: true, duration: true }
    });
  }
}
