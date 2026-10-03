import { Module } from "@nestjs/common";
import { LgpdController } from "./lgpd.controller";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [LgpdController],
  providers: [PrismaService],
})
export class LgpdModule {}
