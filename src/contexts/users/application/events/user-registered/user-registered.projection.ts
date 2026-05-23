import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UserRegisteredEvent } from '../../../domain/events/user-registered.event';
import {
  UserDocument,
  UserDocumentType,
} from '../../../infrastructure/persistence/mongoose/user.schema';

@EventsHandler(UserRegisteredEvent)
export class UserRegisteredProjection
  implements IEventHandler<UserRegisteredEvent>
{
  private readonly logger = new Logger(UserRegisteredProjection.name);

  constructor(
    @InjectModel(UserDocument.name)
    private readonly model: Model<UserDocumentType>,
  ) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    try {
      await this.model
        .findByIdAndUpdate(
          event.userId,
          { _id: event.userId, email: event.email },
          { upsert: true, new: true },
        )
        .exec();
    } catch (error) {
      this.logger.error(
        `Failed to project UserRegisteredEvent for userId=${event.userId}`,
        error,
      );
    }
  }
}
