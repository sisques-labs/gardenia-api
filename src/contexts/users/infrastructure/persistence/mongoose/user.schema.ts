import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'users', timestamps: true })
export class UserDocument {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, required: true, unique: true })
  email!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export type UserDocumentType = HydratedDocument<UserDocument>;

export const UsersModel = SchemaFactory.createForClass(UserDocument);
