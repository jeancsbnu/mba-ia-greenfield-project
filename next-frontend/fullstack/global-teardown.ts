import { compose } from "./stack"

// Derruba o projeto da suíte com os volumes: a próxima execução começa vazia.
// Roda mesmo quando alguma jornada falha.
export default function globalTeardown(): void {
  compose("down", "-v", "--remove-orphans")
}
