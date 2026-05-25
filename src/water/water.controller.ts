import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WaterService } from './water.service';
import { AuthGuard } from 'src/auth/auth.guard';
import type { AuthenticatedRequest } from 'src/auth/auth.interface';
import { PaginationDto } from 'src/dto/pagination.dto';

@Controller('water')
@UseGuards(AuthGuard)
export class WaterController {
  constructor(private readonly waterService: WaterService) {}

  @Get()
  GetWater(@Req() req: AuthenticatedRequest) {
    return this.waterService.getAmoutOfWater(req);
  }

  @Get('list')
  GetListWaterlogs(
    @Req() req: AuthenticatedRequest,
    @Query() paginationDto: PaginationDto
  ) {
    return this.waterService.getListWaterlogs(req, paginationDto);
  }

  @Patch('log')
  UpdateWatetAmount(@Req() req: AuthenticatedRequest, @Query() query) {
    return this.waterService.updateWaterlog(req, query);
  }

  // Delete water log
  @Delete('log/:id')
  deleteWaterlog(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.waterService.deleteWaterlog(req, parseInt(id));
  }

  // Get statistics
  @Get('stats')
  getStats(
    @Req() req: AuthenticatedRequest,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.waterService.getWaterStats(
      req,
      new Date(startDate),
      new Date(endDate)
    );
  }
}
