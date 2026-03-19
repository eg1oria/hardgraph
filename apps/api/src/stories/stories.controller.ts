import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Stories')
@Controller('stories')
export class StoriesController {
  private readonly logger = new Logger(StoriesController.name);

  constructor(private readonly storiesService: StoriesService) {}

  /** Public feed with pagination and filters */
  @Get('feed')
  feed(
    @Query('category') category?: string,
    @Query('field') field?: string,
    @Query('tag') tag?: string,
    @Query('sort') sort?: string,
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('limit') limit?: string,
  ) {
    return this.storiesService.feed({
      category,
      field,
      tag,
      sort,
      search,
      skip: skip ? parseInt(skip, 10) : 0,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  /** My stories (including drafts) */
  @Get('my')
  @UseGuards(JwtAuthGuard)
  myStories(@CurrentUser('id') userId: string) {
    return this.storiesService.findMyStories(userId);
  }

  /** Get own story for editing (includes drafts) */
  @Get('mine/:id')
  @UseGuards(JwtAuthGuard)
  findMine(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.storiesService.findOneForAuthor(id, userId);
  }

  /** Get single published story */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const story = await this.storiesService.findOne(id);
    const ip = req.ip || 'unknown';
    this.storiesService.incrementView(id, ip).catch((err) => {
      this.logger.warn(`Failed to increment view for story ${id}: ${err}`);
    });
    return story;
  }

  /** Create a new story (draft) */
  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 60_000, limit: 10 } })
  create(@Body() dto: CreateStoryDto, @CurrentUser('id') userId: string) {
    return this.storiesService.create(dto, userId);
  }

  /** Update story (only author) */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.storiesService.update(id, dto, userId);
  }

  /** Delete story (only author) */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.storiesService.remove(id, userId);
  }

  /** Publish story */
  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.storiesService.publish(id, userId);
  }

  /** Like a story */
  @Post(':id/like')
  @Throttle({ short: { ttl: 60_000, limit: 30 } })
  @UseGuards(OptionalAuthGuard)
  like(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @CurrentUser('id') userId?: string,
  ) {
    const ip = req.ip || 'unknown';
    return this.storiesService.like(id, ip, userId);
  }

  /** Unlike a story */
  @Delete(':id/like')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalAuthGuard)
  unlike(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @CurrentUser('id') userId?: string,
  ) {
    const ip = req.ip || 'unknown';
    return this.storiesService.unlike(id, ip, userId);
  }

  /** Check if user liked a story */
  @Get(':id/liked')
  @UseGuards(OptionalAuthGuard)
  hasLiked(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @CurrentUser('id') userId?: string,
  ) {
    const ip = req.ip || 'unknown';
    return this.storiesService.hasLiked(id, ip, userId).then((liked) => ({ liked }));
  }

  /** Get comments for a story (tree) */
  @Get(':id/comments')
  getComments(@Param('id', ParseUUIDPipe) id: string) {
    return this.storiesService.getComments(id);
  }

  /** Add a comment */
  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 60_000, limit: 15 } })
  addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.storiesService.addComment(id, userId, dto.content, dto.parentId);
  }

  /** Delete own comment */
  @Delete(':id/comments/:commentId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  removeComment(
    @Param('id', ParseUUIDPipe) _storyId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storiesService.removeComment(commentId, userId);
  }

  /** Get more stories from same author */
  @Get(':id/more-from-author')
  async moreFromAuthor(@Param('id', ParseUUIDPipe) id: string) {
    const story = await this.storiesService.findPublished(id);
    return this.storiesService.getMoreFromAuthor(id, story.authorId);
  }

  /** Get related stories */
  @Get(':id/related')
  async related(@Param('id', ParseUUIDPipe) id: string) {
    const story = await this.storiesService.findPublished(id);
    return this.storiesService.getRelated(id, story.category, story.field);
  }
}
