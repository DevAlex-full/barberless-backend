import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { addMinutes, format, parse, isWithinInterval, startOfDay, endOfDay } from "date-fns";

@Injectable()
export class AgendaService {
  constructor(private prisma: PrismaService) {}

  async getAvailableSlots(professionalId: string, date: Date, serviceId: string) {
    // 1. Get service duration
    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) throw new NotFoundException("Service not found");
    const duration = service.duration;

    // 2. Get professional availability for that day of week
    const dayOfWeek = date.getDay(); // 0-6
    const availabilities = await this.prisma.availability.findMany({
      where: { professionalId, dayOfWeek },
    });

    if (!availabilities.length) return [];

    // 3. Get existing bookings for that day
    const start = startOfDay(date);
    const end = endOfDay(date);
    const bookings = await this.prisma.booking.findMany({
      where: {
        professionalId,
        startTime: { gte: start },
        endTime: { lte: end },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
    });

    const slots = [];
    for (const avail of availabilities) {
      let currentSlotStart = parse(avail.startTime, "HH:mm", date);
      const currentSlotEnd = parse(avail.endTime, "HH:mm", date);

      while (addMinutes(currentSlotStart, duration) <= currentSlotEnd) {
        const slotEnd = addMinutes(currentSlotStart, duration);
        
        const isOverlapping = bookings.some(booking => 
          isWithinInterval(currentSlotStart, { start: booking.startTime, end: booking.endTime }) ||
          isWithinInterval(slotEnd, { start: booking.startTime, end: booking.endTime }) ||
          (booking.startTime >= currentSlotStart && booking.startTime <= slotEnd)
        );

        if (!isOverlapping) {
          slots.push({
            start: currentSlotStart,
            end: slotEnd,
          });
        }
        currentSlotStart = addMinutes(currentSlotStart, 15); // 15 min increments
      }
    }

    return slots;
  }

  async createBooking(data: { 
    customerId: string, 
    professionalId: string, 
    serviceId: string, 
    startTime: Date, 
    notes?: string 
  }) {
    const service = await this.prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!service) throw new NotFoundException("Service not found");
    
    const endTime = addMinutes(data.startTime, service.duration);

    // CRITICAL: Prevent Double Booking (Rule 67)
    const conflict = await this.prisma.booking.findFirst({
      where: {
        professionalId: data.professionalId,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: data.startTime } },
        ],
      },
    });

    if (conflict) {
      throw new ConflictException("This time slot is already booked.");
    }

    return this.prisma.booking.create({
      data: {
        ...data,
        endTime,
      },
    });
  }

  async updateBookingStatus(id: string, status: string) {
    return this.prisma.booking.update({
      where: { id },
      data: { status },
    });
  }
}
