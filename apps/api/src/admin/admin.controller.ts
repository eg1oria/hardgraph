import { Controller, Get, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  getUsers(@Query('take') take?: number, @Query('skip') skip?: number) {
    return this.adminService.getUsers(Math.min(take ?? 50, 100), skip ?? 0);
  }

  @Get('graphs')
  getGraphs(@Query('take') take?: number, @Query('skip') skip?: number) {
    return this.adminService.getGraphs(Math.min(take ?? 50, 100), skip ?? 0);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Delete('graphs/:id')
  deleteGraph(@Param('id') id: string) {
    return this.adminService.deleteGraph(id);
  }
}
