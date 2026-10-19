import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { JwtPayload } from '@otoservis/types';

@Controller('quotes')
@UseGuards(PermissionsGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  async findAll(@CurrentUser() user: JwtPayload, @Query('limit') limit?: string, @Query('page') page?: string, @Query('status') status?: string, @Query('customerId') customerId?: string) {
    const take = limit ? parseInt(limit) : 50;
    const skip = page ? (parseInt(page) - 1) * take : 0;
    return this.quotesService.findAll(user.tenantId, { skip, take }, { status, customerId });
  }

  @Get(':id')
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.quotesService.findOne(user.tenantId, id);
  }

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.quotesService.create(user.tenantId, body);
  }

  @Patch(':id')
  async update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.quotesService.update(user.tenantId, id, body);
  }

  @Patch(':id/status')
  async changeStatus(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body('status') status: string) {
    return this.quotesService.changeStatus(user.tenantId, id, status);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.quotesService.remove(user.tenantId, id);
  }
}
