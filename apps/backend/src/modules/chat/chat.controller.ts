import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ChatService } from './chat.service.js';
import { SendMessageDto, SendMessageSchema } from './dto.js';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('rooms')
  async rooms(@CurrentUser() user: CurrentUser) {
    return this.chat.listRooms(user.sub);
  }

  @Get('rooms/:roomId/messages')
  async messages(
    @CurrentUser() user: CurrentUser,
    @Param('roomId') roomId: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.chat.listMessages(user.sub, roomId, cursor);
  }

  @Post('messages')
  async send(@CurrentUser() user: CurrentUser, @Body() body: SendMessageDto) {
    const dto = SendMessageSchema.parse(body);
    return this.chat.send(user.sub, dto);
  }
}
