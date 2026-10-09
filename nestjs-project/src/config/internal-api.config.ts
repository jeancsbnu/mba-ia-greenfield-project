import { registerAs } from '@nestjs/config';

// Segredo compartilhado com o BFF: só uma requisição que o apresenta pode
// declarar o IP do visitante no header `X-Client-IP`.
export default registerAs('internalApi', () => ({
  secret: process.env.INTERNAL_API_SECRET!,
}));
