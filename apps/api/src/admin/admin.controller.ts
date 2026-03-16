import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import {
  AdminQueryDto,
  UpdateUserDto,
  UpdateGraphDto,
  CreateTemplateDto,
  UpdateTemplateDto,
} from './dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Stats & Analytics ──

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getStats() {
    return this.adminService.getStats();
  }

  @Get('analytics/summary')
  @ApiOperation({ summary: 'Get analytics summary (views, top graphs, referrers, countries)' })
  getAnalyticsSummary() {
    return this.adminService.getAnalyticsSummary();
  }

  @Get('analytics/user-growth')
  @ApiOperation({ summary: 'Get user growth data (last 30 days)' })
  getUserGrowth() {
    return this.adminService.getUserGrowth();
  }

  @Get('recent/users')
  @ApiOperation({ summary: 'Get recent users for dashboard' })
  getRecentUsers() {
    return this.adminService.getRecentUsers();
  }

  @Get('recent/graphs')
  @ApiOperation({ summary: 'Get recent graphs for dashboard' })
  getRecentGraphs() {
    return this.adminService.getRecentGraphs();
  }

  // ── Users ──

  @Get('users')
  @ApiOperation({ summary: 'List users with search, filters, pagination' })
  getUsers(@Query() query: AdminQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID with full details' })
  getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user (role, plan, displayName, bio)' })
  updateUser(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user and all associated data' })
  deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteUser(id);
  }

  // ── Graphs ──

  @Get('graphs')
  @ApiOperation({ summary: 'List graphs with search, filters, pagination' })
  getGraphs(@Query() query: AdminQueryDto) {
    return this.adminService.getGraphs(query);
  }

  @Get('graphs/:id')
  @ApiOperation({ summary: 'Get graph by ID with full details' })
  getGraphById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getGraphById(id);
  }

  @Patch('graphs/:id')
  @ApiOperation({ summary: 'Update graph (title, description, isPublic)' })
  updateGraph(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateGraphDto) {
    return this.adminService.updateGraph(id, dto);
  }

  @Delete('graphs/:id')
  @ApiOperation({ summary: 'Delete graph and all associated data' })
  deleteGraph(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteGraph(id);
  }

  // ── Templates ──

  @Get('templates')
  @ApiOperation({ summary: 'List all templates' })
  getTemplates() {
    return this.adminService.getTemplates();
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create a new template' })
  createTemplate(@Body() dto: CreateTemplateDto) {
    return this.adminService.createTemplate(dto);
  }

  @Patch('templates/:id')
  @ApiOperation({ summary: 'Update template' })
  updateTemplate(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTemplateDto) {
    return this.adminService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete template' })
  deleteTemplate(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteTemplate(id);
  }
}
