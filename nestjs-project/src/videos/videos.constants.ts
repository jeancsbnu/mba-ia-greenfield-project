// Validade das URLs pré-assinadas entregues ao player da watch page
// (per video-watch-page/TD-02, Revisions de 2026-09-26). O default de 300 s
// do StorageService continua valendo para todos os outros contextos — o prazo
// longo é específico da entrega ao player, então quem o informa é a chamada.
export const PLAYBACK_URL_TTL_SECONDS = 6 * 60 * 60;
