import { registerEnumType } from '@nestjs/graphql';

import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { PlantIdentificationQueryableField } from '@contexts/plant-identification/transport/graphql/enums/plant-identification-queryable-field.enum';

registerEnumType(PlantIdentificationOrganEnum, {
  name: 'PlantIdentificationOrganEnum',
  description: 'Plant organ tagged on a submitted identification photo',
});

registerEnumType(PlantIdentificationStatusEnum, {
  name: 'PlantIdentificationStatusEnum',
  description: 'Outcome of a completed plant identification attempt',
});

registerEnumType(PlantIdentificationQueryableField, {
  name: 'PlantIdentificationQueryableFieldEnum',
  description: 'The plant identification fields that can be filtered/sorted on',
});
