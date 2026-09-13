import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  createPaymentSchema, createInvoiceSchema, updateInvoiceSchema,
  cashRegisterOpenSchema, cashTransactionSchema, paginationSchema,
} from '@otoservis/validation';
import type { JwtPayload } from '@otoservis/types';

@Controller('accounting')
@UseGuards(PermissionsGuard)
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // Payments
  @Permissions('accounting.view')
  @Get('payments')
  async findPayments(@CurrentUser() user: JwtPayload, @Query() query: unknown) {
    const params = paginationSchema.parse(query);
    const skip = (params.page - 1) * params.limit;
    return this.accountingService.findPayments(user.tenantId, { skip, take: params.limit });
  }

  @Permissions('accounting.manage')
  @Post('payments')
  async createPayment(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = createPaymentSchema.parse(body);
    return this.accountingService.createPayment(user.tenantId, data, user.sub);
  }

  // Invoices
  @Permissions('accounting.view')
  @Get('invoices')
  async findInvoices(@CurrentUser() user: JwtPayload, @Query() query: unknown) {
    const params = paginationSchema.parse(query);
    const skip = (params.page - 1) * params.limit;
    return this.accountingService.findInvoices(user.tenantId, { skip, take: params.limit });
  }

  @Permissions('accounting.manage')
  @Post('invoices')
  async createInvoice(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = createInvoiceSchema.parse(body);
    return this.accountingService.createInvoice(user.tenantId, data, user.sub);
  }

  @Permissions('accounting.manage')
  @Patch('invoices/:id')
  async updateInvoice(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: unknown) {
    const data = updateInvoiceSchema.parse(body);
    return this.accountingService.updateInvoice(user.tenantId, id, data);
  }

  // Cash Registers
  @Permissions('accounting.view')
  @Get('cash-registers')
  async findCashRegisters(@CurrentUser() user: JwtPayload) {
    return this.accountingService.findCashRegisters(user.tenantId);
  }

  @Permissions('accounting.manage')
  @Post('cash-registers')
  async openCashRegister(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = cashRegisterOpenSchema.parse(body);
    return this.accountingService.openCashRegister(user.tenantId, data);
  }

  @Permissions('accounting.manage')
  @Post('cash-registers/:id/transactions')
  async cashTransaction(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = cashTransactionSchema.parse(body);
    return this.accountingService.cashTransaction(user.tenantId, id, data, user.sub);
  }

  // Customer Accounts
  @Permissions('accounting.view')
  @Get('customer-accounts/:customerId')
  async findCustomerAccount(
    @CurrentUser() user: JwtPayload,
    @Param('customerId') customerId: string,
  ) {
    return this.accountingService.findCustomerAccount(user.tenantId, customerId);
  }
}
