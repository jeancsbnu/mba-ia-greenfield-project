import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// Allowlist herdada de phase-02-auth/TD-10: o nickname é a identidade pública do
// canal e resolve a URL /@{nickname} (TD-08), então não aceita ponto nem hífen.
const NICKNAME_PATTERN = /^[a-z0-9_]+$/;

export class UpdateChannelDto {
  /** Identidade pública do canal; único e global no sistema. */
  @IsOptional()
  @IsString()
  @Matches(NICKNAME_PATTERN, {
    message: 'nickname must contain only lowercase letters, digits and _',
  })
  @MinLength(1)
  @MaxLength(50)
  nickname?: string;

  /** Nome exibido do canal. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  /** Descrição do canal. String vazia grava null. */
  @IsOptional()
  @IsString()
  description?: string;
}
