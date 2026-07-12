import { Criteria } from '@sisques-labs/nestjs-kit';

export interface NodeTelemetryReadingFindByCriteriaQueryInput {
  criteria: Criteria;
}

export class NodeTelemetryReadingFindByCriteriaQuery {
  public readonly criteria: Criteria;

  constructor(input: NodeTelemetryReadingFindByCriteriaQueryInput) {
    this.criteria = input.criteria;
  }
}
