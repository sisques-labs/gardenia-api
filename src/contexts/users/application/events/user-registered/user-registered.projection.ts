import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UserCreatedEvent } from '../../../domain/events/user-created/user-created.event';
import {
  UserDocument,
  UserDocumentType,
} from '../../../infrastructure/persistence/mongoose/user.schema';

@EventsHandler(UserCreatedEvent)
export class UserCreatedProjection implements IEventHandler<UserCreatedEvent> {
  private readonly logger = new Logger(UserCreatedProjection.name);

  constructor(
    @InjectModel(UserDocument.name)
    private readonly model: Model<UserDocumentType>,
  ) {}

  async handle(event: UserCreatedEvent): Promise<void> {
    try {
      await this.model
        .findByIdAndUpdate(
          event.data.id,
          { _id: event.data.id, role: event.data.role, status: event.data.status },
          { upsert: true, new: true },
        )
        .exec();
    } catch (error) {
      this.logger.error(
        `Failed to project UserCreatedEvent for userId=${event.data.id}`,
        error,
      );
    }
  }
}
