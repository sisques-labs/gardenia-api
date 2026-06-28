/**
 * Maps each aggregate root type to its bounded-context module. The module becomes
 * the Kafka topic suffix (`${prefix}.${module}`).
 *
 * A `BaseEvent` only carries `aggregateRootType` (e.g. `PlantAggregate`), not the
 * owning context, and the relationship is not derivable by convention — `auth`
 * owns three aggregates, and modules are pluralised/kebab-cased independently. So
 * the mapping is explicit. **Add a new aggregate here when you create one**; an
 * unmapped aggregate falls back to the `unmapped` topic with a warning.
 */
export const AGGREGATE_MODULE_MAP: Readonly<Record<string, string>> = {
  AccountAggregate: 'auth',
  AuthSessionAggregate: 'auth',
  OAuthIdentityAggregate: 'auth',
  CareLogEntryAggregate: 'care-log',
  CareScheduleAggregate: 'care-schedule',
  HarvestAggregate: 'harvests',
  InventoryItemAggregate: 'inventory',
  PlantSpeciesAggregate: 'plant-species',
  PlantingSpotAggregate: 'planting-spots',
  PlantingSpotPlantAggregate: 'planting-spots',
  PlantAggregate: 'plants',
  QrAggregate: 'qr',
  SpaceAggregate: 'spaces',
  SpaceInvitationAggregate: 'spaces',
  UserAggregate: 'users',
};

/** Module used when an aggregate root type has no explicit mapping. */
export const UNMAPPED_MODULE = 'unmapped';
