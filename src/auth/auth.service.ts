import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { Store } from '../stores/store.entity';
import { Device } from '../devices/device.entity';
import { LoginDto, RegisterDto, RemoveDeviceDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Store) private storeRepo: Repository<Store>,
    @InjectRepository(Device) private deviceRepo: Repository<Device>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already registered');

    const store = this.storeRepo.create({
      name: dto.storeName,
      subscriptionPlan: 'free',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
    });
    await this.storeRepo.save(store);

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: 'owner',
      storeId: store.id,
    });
    await this.userRepo.save(user);

    return { message: 'Registration successful', storeId: store.id };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email, isActive: true },
      relations: ['store'],
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (user.role !== 'admin') {
      if (!user.store || !user.store.isActive) {
        throw new ForbiddenException('Store is suspended');
      }
      if (user.store.expiryDate && new Date(user.store.expiryDate) < new Date()) {
        throw new ForbiddenException('Subscription expired. Please renew to continue.');
      }
    }

    // Check if this device is already registered
    const existingDevice = await this.deviceRepo.findOne({
      where: { userId: user.id, deviceId: dto.deviceId, isActive: true },
    });

    if (!existingDevice) {
      const maxDevices = user.store?.maxDevices ?? this.configService.get<number>('MAX_DEVICES_PER_ACCOUNT') ?? 2;
      const activeDevices = await this.deviceRepo.count({
        where: { userId: user.id, isActive: true },
      });

      if (activeDevices >= maxDevices) {
        const devices = await this.deviceRepo.find({
          where: { userId: user.id, isActive: true },
          order: { lastLogin: 'ASC' },
        });
        throw new ForbiddenException({
          message: 'Maximum device limit reached. Please remove an active device before continuing.',
          code: 'DEVICE_LIMIT_REACHED',
          devices: devices.map((d) => ({ id: d.id, deviceId: d.deviceId, deviceName: d.deviceName, lastLogin: d.lastLogin })),
        });
      }

      const device = this.deviceRepo.create({
        userId: user.id,
        deviceId: dto.deviceId,
        deviceName: dto.deviceName || 'Unknown Device',
        lastLogin: new Date(),
        isActive: true,
      });
      await this.deviceRepo.save(device);
    } else {
      await this.deviceRepo.update(existingDevice.id, { lastLogin: new Date() });
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      storeId: user.storeId,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeId: user.storeId,
        store: user.store,
      },
    };
  }

  async getActiveDevices(userId: string) {
    return this.deviceRepo.find({
      where: { userId, isActive: true },
      order: { lastLogin: 'DESC' },
    });
  }

  async removeDevice(userId: string, deviceId: string) {
    const device = await this.deviceRepo.findOne({
      where: { id: deviceId, userId },
    });
    if (!device) throw new BadRequestException('Device not found');
    await this.deviceRepo.update(device.id, { isActive: false });
    return { message: 'Device removed successfully' };
  }

  async logoutAllDevices(userId: string) {
    await this.deviceRepo.update({ userId, isActive: true }, { isActive: false });
    return { message: 'Logged out from all devices' };
  }
}
