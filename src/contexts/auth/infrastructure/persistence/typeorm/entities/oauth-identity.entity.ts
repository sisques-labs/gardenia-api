import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('oauth_identities')
@Index('idx_oauth_identities_user_id', ['userId'])
@Unique('uq_oauth_identities_provider_user', ['provider', 'providerUserId'])
export class OAuthIdentityTypeOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 16 })
  provider!: string;

  @Column({ name: 'provider_user_id', type: 'varchar', length: 255 })
  providerUserId!: string;

  @Column({ type: 'varchar', length: 320, nullable: true })
  email!: string | null;

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ name: 'access_token_enc', type: 'text', nullable: true })
  accessTokenEnc!: string | null;

  @Column({ name: 'refresh_token_enc', type: 'text', nullable: true })
  refreshTokenEnc!: string | null;

  @Column({ name: 'token_expires_at', type: 'timestamp', nullable: true })
  tokenExpiresAt!: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
