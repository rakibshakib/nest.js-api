import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NoteService {
  private readonly logger = new Logger(NoteService.name);
  constructor(
    private prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async create(
    createNoteDto: CreateNoteDto,
    user: { sub: number; email: string },
  ) {
    // const author = await this.userService.getUserInfoByEmail(user.email);

    const createdNote = await this.prisma.note.create({
      data: {
        title: createNoteDto.title,
        content: createNoteDto.content,
        status: createNoteDto.status ?? 'active',
        userId: user.sub,
      },
    });
    this.logger.log('New Note created successfully', {
      noteId: createdNote.id,
      userId: user.sub,
    });
    return {
      message: 'Note created successfully',
      content: {
        ...createdNote,
        // author,
      },
    };
  }

  async findAll(limit: number, page: number, userId: number) {
    const allNotes = await this.prisma.note.findMany({
      take: limit,
      skip: (page - 1) * limit,
      where: {
        userId: userId,
      },
    });
    return allNotes;
  }

  async findOne(id: number, userId: number) {
    const note = await this.prisma.note.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note?.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to access this note',
      );
    }

    return note;
  }

  async update(id: number, updateNoteDto: UpdateNoteDto, userId: number) {
    // check the note access first
    await this.findOne(id, userId);

    const updatedNote = await this.prisma.note.update({
      where: { id },
      data: {
        ...updateNoteDto,
      },
    });

    return updatedNote;
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);
    const deletedNote = await this.prisma.note.delete({
      where: { id },
    });

    if (!deletedNote) {
      throw new NotFoundException('Note not found');
    }

    return {
      message: 'Note deleted successfully',
    };
  }
}
