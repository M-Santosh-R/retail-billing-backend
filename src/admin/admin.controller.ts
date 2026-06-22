import { Body, Controller, Get, Param, Put, Post, Delete, UseGuards, Request, Query, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';

const AdminGuard = () => UseGuards(AuthGuard('jwt'));

@ApiTags('Admin')
@ApiBearerAuth()
@AdminGuard()
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Admin dashboard stats' })
  getDashboard(@Request() req) {
    this.requireAdmin(req);
    return this.adminService.getDashboard();
  }

  @Get('stores')
  @ApiOperation({ summary: 'List all stores' })
  getAllStores(@Request() req) {
    this.requireAdmin(req);
    return this.adminService.getAllStores();
  }

  @Post('stores')
  @ApiOperation({ summary: 'Create a new store with owner' })
  createStore(@Request() req, @Body() dto: { storeName: string; address?: string; phone?: string; gstNumber?: string; ownerName: string; ownerEmail: string; ownerPassword: string }) {
    this.requireAdmin(req);
    return this.adminService.createStore(dto);
  }

  @Get('stores/:storeId')
  @ApiOperation({ summary: 'Get single store details' })
  getStore(@Request() req, @Param('storeId') storeId: string) {
    this.requireAdmin(req);
    return this.adminService.getStore(storeId);
  }

  @Put('stores/:storeId/details')
  @ApiOperation({ summary: 'Update store details' })
  updateStoreDetails(
    @Request() req,
    @Param('storeId') storeId: string,
    @Body() dto: { name?: string; address?: string; phone?: string; gstNumber?: string; footerMessage?: string; invoicePrefix?: string },
  ) {
    this.requireAdmin(req);
    return this.adminService.updateStoreDetails(storeId, dto);
  }

  @Delete('stores/:storeId')
  @ApiOperation({ summary: 'Delete a store and all its data' })
  deleteStore(@Request() req, @Param('storeId') storeId: string) {
    this.requireAdmin(req);
    return this.adminService.deleteStore(storeId);
  }

  @Put('stores/:storeId/subscription')
  @ApiOperation({ summary: 'Update store subscription' })
  updateSubscription(
    @Request() req,
    @Param('storeId') storeId: string,
    @Body() dto: { plan: string; expiryDate: string; isActive: boolean },
  ) {
    this.requireAdmin(req);
    return this.adminService.updateSubscription(storeId, dto);
  }

  @Get('stores/:storeId/devices')
  @ApiOperation({ summary: 'Get all active devices for a store' })
  getStoreDevices(@Request() req, @Param('storeId') storeId: string) {
    this.requireAdmin(req);
    return this.adminService.getStoreDevices(storeId);
  }

  @Delete('devices/:deviceId')
  @ApiOperation({ summary: 'Force logout a device' })
  forceLogout(@Request() req, @Param('deviceId') deviceId: string) {
    this.requireAdmin(req);
    return this.adminService.forceLogoutDevice(deviceId);
  }

  @Get('stores/:storeId/bills')
  @ApiOperation({ summary: 'List bills for a store' })
  getStoreBills(
    @Request() req,
    @Param('storeId') storeId: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.requireAdmin(req);
    return this.adminService.getStoreBills(storeId, {
      search, startDate, endDate,
      page:  page  ? parseInt(page)  : 1,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('stores/:storeId/bills/:billId')
  @ApiOperation({ summary: 'Get a single bill for a store' })
  getStoreBill(@Request() req, @Param('storeId') storeId: string, @Param('billId') billId: string) {
    this.requireAdmin(req);
    return this.adminService.getStoreBill(storeId, billId);
  }

  @Get('stores/:storeId/reports')
  @ApiOperation({ summary: 'Get reports for a store' })
  getStoreReports(
    @Request() req,
    @Param('storeId') storeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.requireAdmin(req);
    return this.adminService.getStoreReports(storeId, startDate, endDate);
  }

  private requireAdmin(req: any) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException();
    }
  }
}
