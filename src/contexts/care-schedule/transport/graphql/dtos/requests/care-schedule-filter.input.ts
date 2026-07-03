import { InputType } from '@nestjs/graphql';
import { createFilterInput } from '@sisques-labs/nestjs-kit';

import { CareScheduleQueryableField } from '@contexts/care-schedule/transport/graphql/enums/care-schedule-queryable-field.enum';

@InputType('CareScheduleFilterInput')
export class CareScheduleFilterInput extends createFilterInput(
  CareScheduleQueryableField,
  'CareSchedule',
) {}
