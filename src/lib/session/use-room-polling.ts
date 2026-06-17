"use client";

import { useEffect, useState } from "react";
import { getRoomState, type RoomState } from "@/lib/session/session-actions";

/** Pollaa huoneen tilaa ~intervalMs välein; hidastuu kun välilehti piilossa; pysähtyy kun ended. */
export function useRoomPolling(sessionId: string, initial: RoomState, intervalMs = 3000) {
  const [state, setState] = useState<RoomState>(initial);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function tick() {
      if (!active) return;
      try {
        const next = await getRoomState(sessionId);
        if (active) setState(next);
        if (next.session?.status === "ended") return;
      } catch {
        // ohitetaan ohimenevä virhe
      }
      const delay = typeof document !== "undefined" && document.hidden ? intervalMs * 4 : intervalMs;
      timer = setTimeout(tick, delay);
    }
    timer = setTimeout(tick, intervalMs);
    return () => { active = false; clearTimeout(timer); };
  }, [sessionId, intervalMs]);

  return state;
}
