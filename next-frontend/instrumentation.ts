type PatchedFetch = typeof fetch & { _nextOriginalFetch?: typeof fetch };

export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.MSW_ENABLED === "true"
  ) {
    // O fetch nativo, antes de qualquer patch: o do Next guarda o original em
    // `_nextOriginalFetch` se já tiver embrulhado o global.
    const current = globalThis.fetch as PatchedFetch;
    const nativeFetch = current._nextOriginalFetch ?? current;

    const { server } = await import("./mocks/server");
    server.listen({ onUnhandledRequest: "bypass" });

    keepInterceptorAcrossFetchResets(nativeFetch);
  }
}

// Em dev, o Next guarda o fetch nativo no boot e, a cada recompilação de código
// de servidor, roda `resetFetch()` (next/dist/server/lib/router-server.js), que
// devolve esse nativo a `globalThis.fetch` — apagando o interceptor do MSW. Era
// a causa do boot "sem MSW": o upstream vazava para a API real conforme a ordem
// entre a primeira recompilação e as requisições. Aqui, quando alguém tenta
// restaurar o nativo, o global volta a ser o fetch interceptado; qualquer outro
// valor (o patchFetch do Next embrulhando o atual) passa como está.
function keepInterceptorAcrossFetchResets(nativeFetch: typeof fetch) {
  const interceptedFetch = globalThis.fetch;
  let currentFetch = interceptedFetch;
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    enumerable: true,
    get: () => currentFetch,
    set: (next: typeof fetch) => {
      currentFetch = next === nativeFetch ? interceptedFetch : next;
    },
  });
}
