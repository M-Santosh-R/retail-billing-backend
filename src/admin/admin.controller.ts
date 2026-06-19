import { Body, Controller, Get, Param, Put, Delete, UseGuards, Request } from '@nestjs/common';
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

  private requireAdmin(req: any) {
    if (req.user.role !== 'admin') {
      throw new Error('Forbidden');
    }
  }
}
