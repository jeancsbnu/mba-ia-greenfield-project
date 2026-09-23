export abstract class DomainException extends Error {
  constructor(
    public readonly errorCode: string,
    public readonly httpStatus: number,
    message: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class EmailAlreadyExistsException extends DomainException {
  constructor() {
    super('EMAIL_ALREADY_EXISTS', 409, 'Email is already registered');
  }
}

export class InvalidCredentialsException extends DomainException {
  constructor() {
    super('INVALID_CREDENTIALS', 401, 'Invalid email or password');
  }
}

export class EmailNotConfirmedException extends DomainException {
  constructor() {
    super('EMAIL_NOT_CONFIRMED', 403, 'Email address has not been confirmed');
  }
}

export class InvalidTokenException extends DomainException {
  constructor() {
    super('INVALID_TOKEN', 401, 'Token is invalid');
  }
}

export class TokenExpiredException extends DomainException {
  constructor() {
    super('TOKEN_EXPIRED', 401, 'Token has expired');
  }
}

export class TokenReuseDetectedException extends DomainException {
  constructor() {
    super(
      'TOKEN_REUSE_DETECTED',
      401,
      'Token reuse detected — all sessions revoked',
    );
  }
}

export class VideoNotFoundException extends DomainException {
  constructor() {
    super('VIDEO_NOT_FOUND', 404, 'Video not found');
  }
}

export class VideoNotReadyException extends DomainException {
  constructor() {
    super(
      'VIDEO_NOT_READY',
      409,
      'Video is not ready for streaming or download',
    );
  }
}

// Alteração de nickname é livre, mas a unicidade continua valendo (TD-07).
export class NicknameAlreadyExistsException extends DomainException {
  constructor() {
    super('NICKNAME_ALREADY_EXISTS', 409, 'Nickname is already taken');
  }
}

export class ChannelNotFoundException extends DomainException {
  constructor() {
    super('CHANNEL_NOT_FOUND', 404, 'Channel not found');
  }
}

// Publicar exige status = ready: `status` pertence ao Video Worker e um vídeo
// em processamento ou com falha não pode ir ao ar (TD-02, Clarification AMB-1).
export class VideoNotPublishableException extends DomainException {
  constructor() {
    super(
      'VIDEO_NOT_PUBLISHABLE',
      409,
      'Video can only be published once processing has finished',
    );
  }
}

export class VideoForbiddenException extends DomainException {
  constructor() {
    super('FORBIDDEN', 403, 'You do not have access to this video');
  }
}
