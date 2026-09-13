import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  createProductCategorySchema, createProductSchema, updateProductSchema,
  productSearchSchema, stockAdjustmentSchema,
  createSupplierSchema, updateSupplierSchema,
} from '@otoservis/validation';
import type { JwtPayload } from '@otoservis/types';

@Controller('inventory')
@UseGuards(PermissionsGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // Categories
  @Permissions('inventory.view')
  @Get('categories')
  async findCategories(@CurrentUser() user: JwtPayload) {
    return this.inventoryService.findCategories(user.tenantId);
  }

  @Permissions('inventory.manage')
  @Post('categories')
  async createCategory(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = createProductCategorySchema.parse(body);
    return this.inventoryService.createCategory(user.tenantId, data);
  }

  // Products
  @Permissions('inventory.view')
  @Get('products')
  async findProducts(@CurrentUser() user: JwtPayload, @Query() query: unknown) {
    const params = productSearchSchema.parse(query);
    const skip = (params.page - 1) * params.limit;
    return this.inventoryService.findProducts(user.tenantId, { skip, take: params.limit }, {
      q: params.q, categoryId: params.categoryId, brand: params.brand, lowStock: params.lowStock,
    });
  }

  @Permissions('inventory.view')
  @Get('products/:id')
  async findProduct(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.inventoryService.findProduct(user.tenantId, id);
  }

  @Permissions('inventory.manage')
  @Post('products')
  async createProduct(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = createProductSchema.parse(body);
    return this.inventoryService.createProduct(user.tenantId, data, user.sub);
  }

  @Permissions('inventory.manage')
  @Patch('products/:id')
  async updateProduct(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: unknown) {
    const data = updateProductSchema.parse(body);
    return this.inventoryService.updateProduct(user.tenantId, id, data, user.sub);
  }

  @Permissions('inventory.manage')
  @Post('products/:id/stock-adjust')
  async adjustStock(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: unknown) {
    const data = stockAdjustmentSchema.parse(body);
    return this.inventoryService.adjustStock(user.tenantId, id, data.quantity, data.note, user.sub);
  }

  // Suppliers
  @Permissions('inventory.view')
  @Get('suppliers')
  async findSuppliers(@CurrentUser() user: JwtPayload) {
    return this.inventoryService.findSuppliers(user.tenantId);
  }

  @Permissions('inventory.manage')
  @Post('suppliers')
  async createSupplier(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = createSupplierSchema.parse(body);
    return this.inventoryService.createSupplier(user.tenantId, data);
  }

  @Permissions('inventory.manage')
  @Patch('suppliers/:id')
  async updateSupplier(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: unknown) {
    const data = updateSupplierSchema.parse(body);
    return this.inventoryService.updateSupplier(user.tenantId, id, data);
  }
}
