import { InputType } from '@nestjs/graphql';
import { createSortInput } from '@sisques-labs/nestjs-kit/graphql';

import { CareScheduleQueryableField } from '@contexts/care-schedule/transport/graphql/enums/care-schedule-queryable-field.enum';

@InputType('CareScheduleSortInput')
export class CareScheduleSortInput extends createSortInput(
  CareScheduleQueryableField,
  'CareSchedule',
) {}
