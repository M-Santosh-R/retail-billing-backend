import { Body, Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StoresService, UpdateStoreDto } from './stores.service';

@ApiTags('Store Settings')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('store')
export class StoresController {
  constructor(private storesService: StoresService) {}

  @Get()
  @ApiOperation({ summary: 'Get current store info' })
  getStore(@Request() req) {
    return this.storesService.findById(req.user.storeId);
  }

  @Put()
  @ApiOperation({ summary: 'Update store settings' })
  updateStore(@Request() req, @Body() dto: UpdateStoreDto) {
    return this.storesService.update(req.user.storeId, dto);
  }
}
