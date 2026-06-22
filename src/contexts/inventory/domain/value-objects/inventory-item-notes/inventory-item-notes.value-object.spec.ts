import { InventoryItemNotesValueObject } from './inventory-item-notes.value-object';

describe('InventoryItemNotesValueObject', () => {
  it('wraps non-empty notes', () => {
    expect(
      new InventoryItemNotesValueObject('Store in a dry place').value,
    ).toBe('Store in a dry place');
  });

  it('throws for an empty string', () => {
    expect(() => new InventoryItemNotesValueObject('')).toThrow();
  });

  it('accepts notes of exactly MAX_LENGTH chars', () => {
    const notes = 'a'.repeat(InventoryItemNotesValueObject.MAX_LENGTH);

    expect(() => new InventoryItemNotesValueObject(notes)).not.toThrow();
  });

  it('throws for notes longer than MAX_LENGTH', () => {
    const notes = 'a'.repeat(InventoryItemNotesValueObject.MAX_LENGTH + 1);

    expect(() => new InventoryItemNotesValueObject(notes)).toThrow();
  });
});
