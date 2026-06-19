import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/bill.dto';

@ApiTags('Bills')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('bills')
export class BillsController {
  constructor(private billsService: BillsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bill' })
  create(@Request() req, @Body() dto: CreateBillDto) {
    return this.billsService.create(req.user.storeId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get bill history with filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  findAll(
    @Request() req,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
  ) {
    return this.billsService.findAll(req.user.storeId, { search, startDate, endDate, page });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bill details' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.billsService.findOne(req.user.storeId, id);
  }
}
