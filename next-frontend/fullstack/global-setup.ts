import { compose } from "./stack"

// Sobe o projeto da suíte do zero e só volta quando os serviços estão
// saudáveis. Um `down -v` antes garante volumes vazios mesmo se uma execução
// anterior foi interrompida antes do teardown (testes-producao/TD-02:
// ambiente zerado por execução).
export default function globalSetup(): void {
  compose("down", "-v", "--remove-orphans")
  compose("up", "-d", "--build", "--wait", "--wait-timeout", "300")
}
