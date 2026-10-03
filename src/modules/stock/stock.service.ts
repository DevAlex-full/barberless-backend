import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async createProduct(data: { name: string, price: number, stock: number, minStock?: number }) {
    return this.prisma.product.create({ data });
  }

  async updateStock(productId: string, quantity: number, type: 'ENTRY' | 'SALE' | 'WASTE' | 'ADJUSTMENT', notes?: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException("Product not found");

    // Atomic update of stock
    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity } }
    });

    if (updatedProduct.stock < 0) {
      // Rollback (simplified for this implementation)
      await this.prisma.product.update({
        where: { id: productId },
        data: { stock: { increment: -quantity } }
      });
      throw new BadRequestException("Insufficient stock");
    }

    return this.prisma.stockMovement.create({
      data: { productId, quantity, type, notes }
    });
  }

  async listProducts() {
    return this.prisma.product.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async getLowStock() {
    return this.prisma.product.findMany({
      where: {
        stock: { lte: this.prisma.product.fields.minStock } // This is pseudo-code, simplified below
      }
    });
  }
}
