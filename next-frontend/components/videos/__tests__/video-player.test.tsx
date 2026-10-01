// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  VIEW_THRESHOLD_SECONDS,
  VideoPlayer,
  type MediaTimeSource,
} from "../video-player";

const PUBLIC_ID = "watch-video";
const VIEW_URL = `/api/videos/${PUBLIC_ID}/view`;

// O POST vai para o Route Handler same-origin, que o MSW não intercepta — ele
// finge apenas a API upstream. O alvo aqui é o fetch do próprio player.
const fetchMock = vi.fn();

/**
 * Fachada de mídia controlada pelo teste (TD-06, Option A). É ela que torna o
 * limiar afirmável sem um `<video>` reproduzindo em tempo real: o teste emite
 * os tempos que quiser, na ordem que quiser.
 */
function fakeTimeSource() {
  let emit: ((currentTime: number) => void) | null = null;
  const source: MediaTimeSource = {
    subscribe(listener) {
      emit = listener;
      return () => {
        emit = null;
      };
    },
  };
  return {
    factory: () => source,
    /** Avança a mídia em passos pequenos, como o `timeupdate` real faria. */
    advanceTo(seconds: number, from = 0) {
      for (let t = from + 0.25; t <= seconds + 1e-9; t += 0.25) {
        emit?.(Number(t.toFixed(2)));
      }
    },
    seekTo(seconds: number) {
      emit?.(seconds);
    },
  };
}

function renderPlayer(timeSource: (element: HTMLVideoElement) => MediaTimeSource) {
  return render(
    <VideoPlayer
      src="http://storage.test/videos/fixture.mp4?X-Amz-Signature=stream"
      title="Tour pelo estúdio"
      publicId={PUBLIC_ID}
      timeSource={timeSource}
    />
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("VideoPlayer — gatilho da contagem", () => {
  it("does not register a view below the threshold", async () => {
    const media = fakeTimeSource();
    renderPlayer(media.factory);

    media.advanceTo(VIEW_THRESHOLD_SECONDS - 1);

    // Espera uma volta do event loop para que um POST indevido tivesse tempo
    // de sair antes de afirmarmos que não saiu.
    await Promise.resolve();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("registers exactly one view when the threshold is crossed", async () => {
    const media = fakeTimeSource();
    renderPlayer(media.factory);

    media.advanceTo(VIEW_THRESHOLD_SECONDS + 1);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        VIEW_URL,
        expect.objectContaining({ method: "POST" })
      );
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not register again on a second crossing in the same mount", async () => {
    const media = fakeTimeSource();
    renderPlayer(media.factory);

    media.advanceTo(VIEW_THRESHOLD_SECONDS + 1);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    // Volta ao início e cruza o limiar de novo: o gatilho é uma vez por
    // montagem do player, não por travessia.
    media.seekTo(0);
    media.advanceTo(VIEW_THRESHOLD_SECONDS + 1);

    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("re-arms the trigger on a fresh mount", async () => {
    const first = fakeTimeSource();
    const { unmount } = renderPlayer(first.factory);
    first.advanceTo(VIEW_THRESHOLD_SECONDS + 1);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    unmount();

    const second = fakeTimeSource();
    renderPlayer(second.factory);
    second.advanceTo(VIEW_THRESHOLD_SECONDS + 1);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  it("counts advanced media time, not a seek across the threshold", async () => {
    const media = fakeTimeSource();
    renderPlayer(media.factory);

    // Arrastar a barra de progresso para além do limiar não é reprodução.
    media.seekTo(0.25);
    media.seekTo(120);

    await Promise.resolve();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stays silent for the viewer when the count request fails", async () => {
    fetchMock.mockRejectedValue(new Error("429 Too Many Requests"));
    const media = fakeTimeSource();
    const { container } = renderPlayer(media.factory);

    media.advanceTo(VIEW_THRESHOLD_SECONDS + 1);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    // A contagem é métrica, não função da página: nada de alerta, e o player
    // continua montado (TD-05).
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.querySelector("video")).not.toBeNull();
  });
});
