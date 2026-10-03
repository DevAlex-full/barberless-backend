import { Module } from "@nestjs/common";
import { ComandaService } from "./comanda.service";
import { ComandaController } from "./comanda.controller";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [ComandaController],
  providers: [ComandaService, PrismaService],
})
export class ComandaModule {}
