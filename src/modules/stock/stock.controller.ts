import { Controller, Get, Post, Patch, Body, Param, UseGuards } from "@nestjs/common";
import { StockService } from "./stock.service";
import { AuthenticateGuard } from "../auth/guards/authenticate.guard";
import { AuthorizeGuard } from "../auth/guards/authorize.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("stock")
@UseGuards(AuthenticateGuard)
export class StockController {
  constructor(private stockService: StockService) {}

  @Post("products")
  @Roles("OWNER")
  async create(@Body() body: any) {
    return this.stockService.createProduct(body);
  }

  @Get("products")
  @Roles("OWNER", "RECEPTIONIST")
  async list() {
    return this.stockService.listProducts();
  }

  @Patch("adjust")
  @Roles("OWNER")
  async adjust(@Body() body: { productId: string, quantity: number, type: any, notes?: string }) {
    return this.stockService.updateStock(body.productId, body.quantity, body.type, body.notes);
  }
}
