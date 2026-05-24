import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { UserRoleEnum, UserStatusEnum } from '@sisques-labs/nestjs-kit';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'users', timestamps: true })
export class UserDocument {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, required: true })
  role!: UserRoleEnum;

  @Prop({ type: String, required: true })
  status!: UserStatusEnum;

  @Prop({ type: String, required: false })
  email?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export type UserDocumentType = HydratedDocument<UserDocument>;

export const UsersModel = SchemaFactory.createForClass(UserDocument);
