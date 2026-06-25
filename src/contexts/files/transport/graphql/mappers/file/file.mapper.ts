import { Injectable } from '@nestjs/common';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { FileViewModel } from '@contexts/files/domain/view-models/file.view-model';
import {
  FileResponseDto,
  PaginatedFileResultDto,
} from '@contexts/files/transport/graphql/dtos/responses/file.response.dto';

@Injectable()
export class FileGraphQLMapper {
  toResponseDto(vm: FileViewModel): FileResponseDto {
    return {
      id: vm.id,
      filename: vm.filename,
      mimeType: vm.mimeType,
      size: vm.size,
      url: vm.url,
      userId: vm.userId,
      spaceId: vm.spaceId,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }

  toPaginatedResponseDto(
    paginatedResult: PaginatedResult<FileViewModel>,
  ): PaginatedFileResultDto {
    return {
      items: paginatedResult.items.map((vm) => this.toResponseDto(vm)),
      total: paginatedResult.total,
      page: paginatedResult.page,
      perPage: paginatedResult.perPage,
      totalPages: paginatedResult.totalPages,
    };
  }
}
