import { Injectable, Logger } from '@nestjs/common';
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

  findAll() {
    return `This action returns all note`;
  }

  findOne(id: number) {
    return `This action returns a #${id} note`;
  }

  update(id: number, updateNoteDto: UpdateNoteDto) {
    return `This action updates a #${id} note`;
  }

  remove(id: number) {
    return `This action removes a #${id} note`;
  }
}
