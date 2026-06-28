import { registerEnumType } from '@nestjs/graphql';

import { FileMimeTypeEnum } from '@contexts/files/domain/enums/file-mime-type.enum';

registerEnumType(FileMimeTypeEnum, {
  name: 'FileMimeType',
  description: 'Allowed image MIME types for uploaded files',
});
