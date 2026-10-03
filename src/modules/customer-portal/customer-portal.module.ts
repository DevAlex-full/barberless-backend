import { Module } from "@nestjs/common";
import { CustomerPortalController } from "./customer-portal.controller";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [CustomerPortalController],
  providers: [PrismaService],
})
export class CustomerPortalModule {}
