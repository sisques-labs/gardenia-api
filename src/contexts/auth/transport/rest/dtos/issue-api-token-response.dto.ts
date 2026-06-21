import { ApiProperty } from '@nestjs/swagger';

export class IssueApiTokenResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    description:
      'Plaintext token — shown once, store it now (cannot be re-read)',
  })
  token!: string;
}
