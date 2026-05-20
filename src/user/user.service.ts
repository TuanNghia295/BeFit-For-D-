import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    userName: string;
  };
}

export interface MeResponse {
  id: number;
  userName: string;
}

@Injectable()
export class UserService {
  getMe(request: AuthenticatedRequest): MeResponse {
    const { sub, userName } = request.user;

    return {
      id: sub,
      userName,
    };
  }
}
