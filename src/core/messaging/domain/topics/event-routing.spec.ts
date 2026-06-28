import {
  deriveAction,
  resolveModule,
} from '@core/messaging/domain/topics/event-routing';

describe('event-routing', () => {
  describe('resolveModule', () => {
    it.each([
      ['PlantAggregate', 'plants'],
      ['PlantSpeciesAggregate', 'plant-species'],
      ['PlantingSpotPlantAggregate', 'planting-spots'],
      ['AccountAggregate', 'auth'],
      ['AuthSessionAggregate', 'auth'],
      ['OAuthIdentityAggregate', 'auth'],
      ['SpaceInvitationAggregate', 'spaces'],
      ['CareLogEntryAggregate', 'care-log'],
      ['CareScheduleAggregate', 'care-schedule'],
      ['FileAggregate', 'files'],
    ])('maps %s -> %s', (aggregateRootType, expected) => {
      expect(resolveModule(aggregateRootType)).toEqual({
        module: expected,
        fallback: false,
      });
    });

    it('falls back to the unmapped module for unknown aggregate types', () => {
      expect(resolveModule('SomethingNewAggregate')).toEqual({
        module: 'unmapped',
        fallback: true,
      });
    });
  });

  describe('deriveAction', () => {
    it.each([
      ['PlantCreatedEvent', 'plant-created'],
      ['PlantUpdatedEvent', 'plant-updated'],
      ['PlantNameChangedEvent', 'plant-name-changed'],
      ['UserCreationFailedEvent', 'user-creation-failed'],
      ['OAuthIdentityLinkedEvent', 'o-auth-identity-linked'],
    ])('kebab-cases %s -> %s', (eventType, expected) => {
      expect(deriveAction(eventType)).toBe(expected);
    });
  });
});
