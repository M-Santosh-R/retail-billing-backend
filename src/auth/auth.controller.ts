import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new store owner' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with device tracking' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('devices')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active devices for current user' })
  getDevices(@Request() req) {
    return this.authService.getActiveDevices(req.user.id);
  }

  @Delete('devices/:deviceId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a specific device' })
  removeDevice(@Request() req, @Param('deviceId') deviceId: string) {
    return this.authService.removeDevice(req.user.id, deviceId);
  }

  @Post('logout-all')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices' })
  logoutAll(@Request() req) {
    return this.authService.logoutAllDevices(req.user.id);
  }
}
