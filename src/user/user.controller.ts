import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { type AuthenticatedRequest } from 'src/auth/auth.interface';
import { UserService } from './user.service';
import { UpdateUserInfoDto } from 'src/dto/user/updateUserinfo.dto';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getMe(@Req() request: AuthenticatedRequest) {
    return this.userService.getMe(request);
  }

  @Patch()
  updateUser(
    @Body() body: UpdateUserInfoDto,
    @Req() request: AuthenticatedRequest
  ) {
    return this.userService.update(body, request);
  }
}
