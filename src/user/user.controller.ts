import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  type AuthenticatedRequest,
  type MeResponse,
  UserService,
} from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get()
  getMe(@Req() request: AuthenticatedRequest): MeResponse {
    return this.userService.getMe(request);
  }
}
