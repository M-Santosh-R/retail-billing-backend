import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { CreateItemDto, UpdateItemDto } from './dto/item.dto';

@ApiTags('Items')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('items')
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new item' })
  create(@Request() req, @Body() dto: CreateItemDto) {
    return this.itemsService.create(req.user.storeId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all items with optional search' })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Request() req, @Query('search') search?: string) {
    return this.itemsService.findAll(req.user.storeId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific item' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.itemsService.findOne(req.user.storeId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an item' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.itemsService.update(req.user.storeId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete an item' })
  remove(@Request() req, @Param('id') id: string) {
    return this.itemsService.remove(req.user.storeId, id);
  }
}
