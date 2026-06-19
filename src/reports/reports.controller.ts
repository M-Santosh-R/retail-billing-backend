import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard stats (today, weekly, monthly)' })
  getDashboard(@Request() req) {
    return this.reportsService.getDashboard(req.user.storeId);
  }

  @Get('most-sold')
  @ApiOperation({ summary: 'Get most sold items' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getMostSold(@Request() req, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportsService.getMostSoldItems(req.user.storeId, startDate, endDate);
  }

  @Get('highest-revenue')
  @ApiOperation({ summary: 'Get highest revenue items' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getHighestRevenue(@Request() req, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportsService.getHighestRevenueItems(req.user.storeId, startDate, endDate);
  }

  @Get('custom-range')
  @ApiOperation({ summary: 'Get report for custom date range' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  getCustomRange(@Request() req, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.reportsService.getCustomRange(req.user.storeId, startDate, endDate);
  }
}
