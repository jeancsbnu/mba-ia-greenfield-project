export const BEARER_PREFIX = 'Bearer ';

// Headers que o BFF anexa a toda chamada ao Nest (rate-limit-visitor-identity/TD-02),
// em minúsculas como o Node os expõe em `req.headers`.
export const CLIENT_IP_HEADER = 'x-client-ip';
export const INTERNAL_TOKEN_HEADER = 'x-internal-token';

export const TOKEN_REUSE_GRACE_PERIOD_MS = 10_000;
