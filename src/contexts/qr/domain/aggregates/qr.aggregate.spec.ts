import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { QrCreatedEvent } from '@contexts/qr/domain/events/qr-created/qr-created.event';
import { QrDeletedEvent } from '@contexts/qr/domain/events/qr-deleted/qr-deleted.event';
import { QrRegeneratedEvent } from '@contexts/qr/domain/events/qr-regenerated/qr-regenerated.event';
import { QrIdValueObject } from '@contexts/qr/domain/value-objects/qr-id/qr-id.value-object';
import { QrTargetUrlValueObject } from '@contexts/qr/domain/value-objects/qr-target-url/qr-target-url.value-object';
import { QrAggregate } from '@contexts/qr/domain/aggregates/qr.aggregate';

const QR_ID = '550e8400-e29b-41d4-a716-446655440000';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01');

const buildQr = (): QrAggregate =>
  new QrAggregate({
    id: new QrIdValueObject(QR_ID),
    spaceId: new UuidValueObject(SPACE_ID),
    targetUrl: new QrTargetUrlValueObject(
      `http://localhost:3000/plants/example?spaceId=${SPACE_ID}`,
    ),
    generation: 1,
    createdAt: new DateValueObject(NOW),
    updatedAt: new DateValueObject(NOW),
  });

describe('QrAggregate', () => {
  it('create() emits QrCreatedEvent', () => {
    const qr = buildQr();
    qr.create();

    const events = qr.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(QrCreatedEvent);
  });

  it('regenerate() increments generation and emits QrRegeneratedEvent', () => {
    const qr = buildQr();
    qr.regenerate();

    expect(qr.generation).toBe(2);
    const events = qr.getUncommittedEvents();
    expect(events[0]).toBeInstanceOf(QrRegeneratedEvent);
  });

  it('delete() emits QrDeletedEvent', () => {
    const qr = buildQr();
    qr.delete();

    const events = qr.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(QrDeletedEvent);
  });
});
