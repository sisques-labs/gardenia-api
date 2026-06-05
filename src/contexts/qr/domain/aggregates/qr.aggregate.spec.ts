import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { QrCreatedEvent } from '@contexts/qr/domain/events/qr-created/qr-created.event';
import { QrDeletedEvent } from '@contexts/qr/domain/events/qr-deleted/qr-deleted.event';
import { QrRegeneratedEvent } from '@contexts/qr/domain/events/qr-regenerated/qr-regenerated.event';
import { QrExpiresAtValueObject } from '@contexts/qr/domain/value-objects/qr-expires-at/qr-expires-at.value-object';
import { QrGenerationValueObject } from '@contexts/qr/domain/value-objects/qr-generation/qr-generation.value-object';
import { QrIdValueObject } from '@contexts/qr/domain/value-objects/qr-id/qr-id.value-object';
import { QrTargetUrlValueObject } from '@contexts/qr/domain/value-objects/qr-target-url/qr-target-url.value-object';
import { QrAggregate } from '@contexts/qr/domain/aggregates/qr.aggregate';

const QR_ID = '550e8400-e29b-41d4-a716-446655440000';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01');
const FUTURE_DATE = new Date(Date.now() + 1000 * 60 * 60 * 24);
const PAST_DATE = new Date('2020-01-01');

const buildQr = (
  expiresAt: QrExpiresAtValueObject | null = null,
): QrAggregate =>
  new QrAggregate({
    id: new QrIdValueObject(QR_ID),
    spaceId: new UuidValueObject(SPACE_ID),
    targetUrl: new QrTargetUrlValueObject(
      `http://localhost:3000/plants/example?spaceId=${SPACE_ID}`,
    ),
    generation: new QrGenerationValueObject(1),
    expiresAt,
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

    expect(qr.generation.value).toBe(2);
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

  describe('isExpired()', () => {
    it('returns false when expiresAt is null', () => {
      const qr = buildQr(null);

      expect(qr.isExpired()).toBe(false);
    });

    it('returns false when expiresAt is in the future', () => {
      const qr = buildQr(new QrExpiresAtValueObject(FUTURE_DATE));

      expect(qr.isExpired()).toBe(false);
    });

    it('returns true when expiresAt is in the past', () => {
      const qr = buildQr(new QrExpiresAtValueObject(PAST_DATE));

      expect(qr.isExpired()).toBe(true);
    });
  });

  describe('checkExpiresAt()', () => {
    it('does not throw when expiresAt is null', () => {
      const qr = buildQr(null);

      expect(() => qr.checkExpiresAt()).not.toThrow();
    });

    it('does not throw when expiresAt is in the future', () => {
      const qr = buildQr(new QrExpiresAtValueObject(FUTURE_DATE));

      expect(() => qr.checkExpiresAt()).not.toThrow();
    });

    it('throws when expiresAt is in the past', () => {
      const qr = buildQr(new QrExpiresAtValueObject(PAST_DATE));

      expect(() => qr.checkExpiresAt()).toThrow(
        'expiresAt must be a future date',
      );
    });

    it('throws when expiresAt equals now (boundary)', () => {
      const qr = buildQr(new QrExpiresAtValueObject(new Date()));

      expect(() => qr.checkExpiresAt()).toThrow(
        'expiresAt must be a future date',
      );
    });
  });
});
