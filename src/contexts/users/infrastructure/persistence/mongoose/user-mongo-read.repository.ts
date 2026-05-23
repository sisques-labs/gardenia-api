import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  IUserReadRepository,
  UserViewModel,
} from '../../../domain/repositories/i-user-read.repository';
import { UserDocument, UserDocumentType } from './user.schema';

@Injectable()
export class UserMongoReadRepository implements IUserReadRepository {
  constructor(
    @InjectModel(UserDocument.name)
    private readonly model: Model<UserDocumentType>,
  ) {}

  async findById(id: string): Promise<UserViewModel | null> {
    const doc = await this.model.findById(id).lean().exec();
    if (!doc) return null;

    return {
      id: doc._id as string,
      email: doc.email,
      createdAt: doc.createdAt,
    };
  }
}
