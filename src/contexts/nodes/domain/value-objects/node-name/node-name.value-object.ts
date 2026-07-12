import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class NodeNameValueObject extends StringValueObject {
  constructor(value: string) {
    super(value, { maxLength: 100, allowEmpty: false });
  }
}
