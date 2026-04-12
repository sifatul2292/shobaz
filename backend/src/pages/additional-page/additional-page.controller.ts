import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { AdminMetaRoles } from '../../decorator/admin-roles.decorator';
import { AdminRoles } from '../../enum/admin-roles.enum';
import { AdminRolesGuard } from '../../guards/admin-roles.guard';
import { AdminMetaPermissions } from '../../decorator/admin-permissions.decorator';
import { AdminPermissions } from '../../enum/admin-permission.enum';
import { AdminPermissionGuard } from '../../guards/admin-permission.guard';
import { AdminJwtAuthGuard } from '../../guards/admin-jwt-auth.guard';
import { ResponsePayload } from '../../interfaces/core/response-payload.interface';
import { MongoIdValidationPipe } from '../../pipes/mongo-id-validation.pipe';
import { AdditionalPageService } from './additional-page.service';
import {
  AddAdditionalPageDto,
  FilterAndPaginationAdditionalPageDto,
  UpdateAdditionalPageDto,
} from '../../dto/additional-page.dto';

@Controller('additional-page')
export class AdditionalPageController {
  private logger = new Logger(AdditionalPageController.name);

  constructor(private additionalPageService: AdditionalPageService) {}

  /**
   * addAdditionalPage
   * insertManyAdditionalPage
   */
  @Post('/add')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async addAdditionalPage(
    @Body()
    addAdditionalPageDto: AddAdditionalPageDto,
  ): Promise<ResponsePayload> {
    return await this.additionalPageService.addAdditionalPage(
      addAdditionalPageDto,
    );
  }

  /**
   * GET /get-all — PUBLIC endpoint, must be before /:slug
   * Returns all pages optionally filtered by showInFooter / showInHeader
   */
  @Version(VERSION_NEUTRAL)
  @Get('/get-all')
  async getAllAdditionalPages(
    @Query('showInFooter') showInFooter: string,
    @Query('showInHeader') showInHeader: string,
    @Query('includeInactive') includeInactive: string,
  ): Promise<ResponsePayload> {
    const filter: any = {};
    if (includeInactive !== 'true') filter.isActive = true;
    if (showInFooter === 'true') filter.showInFooter = true;
    if (showInHeader === 'true') filter.showInHeader = true;
    return this.additionalPageService.getAllAdditionalPages(filter);
  }

  /**
   * POST /get-all-query — PUBLIC endpoint for querying with filter body
   */
  @Version(VERSION_NEUTRAL)
  @Post('/get-all-query')
  @UsePipes(ValidationPipe)
  async getAllAdditionalPagesByQuery(
    @Body() filterDto: FilterAndPaginationAdditionalPageDto,
  ): Promise<ResponsePayload> {
    return this.additionalPageService.getAllAdditionalPages(
      filterDto.filter as any,
    );
  }

  /**
   * GET /:slug — must come AFTER /get-all and other fixed routes
   */
  @Version(VERSION_NEUTRAL)
  @Get('/:slug')
  async getAdditionalPageById(
    @Param('slug') slug: string,
    @Query() select: string,
  ): Promise<ResponsePayload> {
    return await this.additionalPageService.getAdditionalPageBySlug(
      slug,
      select,
    );
  }

  /**
   * updateAdditionalPageById (by slug)
   */
  @Version(VERSION_NEUTRAL)
  @Put('/update-data/:slug')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateAdditionalPageById(
    @Param('slug') slug: string,
    @Body() updateAdditionalPageDto: UpdateAdditionalPageDto,
  ): Promise<ResponsePayload> {
    return await this.additionalPageService.updateAdditionalPageBySlug(
      slug,
      updateAdditionalPageDto,
    );
  }

  /**
   * updateAdditionalPageByMongoId (by MongoDB _id)
   */
  @Version(VERSION_NEUTRAL)
  @Put('/update-by-id/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateAdditionalPageByMongoId(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateAdditionalPageDto: UpdateAdditionalPageDto,
  ): Promise<ResponsePayload> {
    return await this.additionalPageService.updateAdditionalPageBySlug(
      id,
      updateAdditionalPageDto,
    );
  }

  /**
   * deleteAdditionalPageById (by slug)
   */
  @Version(VERSION_NEUTRAL)
  @Delete('/delete-data/:slug')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async deleteAdditionalPageById(
    @Param('slug') slug: string,
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.additionalPageService.deleteAdditionalPageBySlug(
      slug,
      Boolean(checkUsage),
    );
  }
}
