import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { WaterService } from './water.service';
import { AuthGuard } from 'src/auth/auth.guard';
import type { AuthenticatedRequest } from 'src/auth/auth.interface';
import { PaginationDto } from 'src/dto/pagination.dto';

@Controller('water')
export class WaterController {
  constructor(private readonly waterService: WaterService) {}

  @UseGuards(AuthGuard)
  @Get()
  GetWater(@Req() req: AuthenticatedRequest) {
    return this.waterService.getAmoutOfWater(req);
  }

  @UseGuards(AuthGuard)
  @Get('list')
  lGetListWaterlogs(
    @Req() req: AuthenticatedRequest,
    @Query() paginationDto: PaginationDto
  ) {
    return this.waterService.getListWaterlogs(req, paginationDto);
  }
}
