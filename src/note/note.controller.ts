import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthenticationGuard } from 'src/auth/auth.guard';
import { CurrentUser, QueryPagination } from 'src/common/decorators';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteService } from './note.service';

@Controller('api/notes')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @UseGuards(AuthenticationGuard)
  @Post()
  create(
    @Body() createNoteDto: CreateNoteDto,
    @CurrentUser() user: { sub: number; email: string },
  ) {
    return this.noteService.create(createNoteDto, user);
  }

  @UseGuards(AuthenticationGuard)
  @Get()
  findAll(
    @QueryPagination() { page, limit }: { page: number; limit: number },
    @CurrentUser('sub') userId: number,
  ) {
    return this.noteService.findAll(limit, page, userId);
  }

  @UseGuards(AuthenticationGuard)
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') userId: number,
  ) {
    return this.noteService.findOne(id, userId);
  }

  @UseGuards(AuthenticationGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNoteDto: UpdateNoteDto,
    @CurrentUser('sub') userId: number,
  ) {
    return this.noteService.update(id, updateNoteDto, userId);
  }

  @UseGuards(AuthenticationGuard)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') userId: number,
  ) {
    return this.noteService.remove(id, userId);
  }
}
