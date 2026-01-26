import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './expense.interface';

@Controller('api/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll() {
    return this.expensesService.findAll();
  }

  @Get('summary')
  getSummary() {
    return this.expensesService.getSummary();
  }

  @Get('patterns')
  getPatterns() {
    return this.expensesService.getPatterns();
  }

  @Get('trends')
  getTrends(@Query('months') months?: string) {
    return this.expensesService.getMonthlyTrends(months ? parseInt(months) : 6);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateExpenseDto) {
    return this.expensesService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateExpenseDto>) {
    return this.expensesService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return { success: this.expensesService.delete(id) };
  }
}
