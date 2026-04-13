import { useEffect, useState } from "react";
import { BroadcastChannelTransport } from "../transport";
import type { MapMessage, MapState, MapTransport, PingEntry } from "../types";

interface Params {
  view: "dm" | "player";
  peerTransport: MapTransport | null;
  mapStateRef: React.RefObject<MapState>;
  transportRef: React.RefObject<MapTransport | null>;
  pingsRef: React.RefObject<PingEntry[]>;
  nextPingIdRef: React.RefObject<number>;
  setMapState: React.Dispatch<React.SetStateAction<MapState>>;
  setPeerTransport: React.Dispatch<React.SetStateAction<MapTransport | null>>;
  setPeerDisconnected: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useMapSync({
  view,
  peerTransport,
  mapStateRef,
  transportRef,
  pingsRef,
  nextPingIdRef,
  setMapState,
  setPeerTransport,
  setPeerDisconnected,
}: Params): { synced: boolean } {
  const [synced, setSynced] = useState(view === "dm");

  useEffect(() => {
    const isLocalTransport = !peerTransport;
    const transport = peerTransport ?? new BroadcastChannelTransport();
    transportRef.current = transport;

    const unsub = transport.onMessage((msg: MapMessage) => {
      if (view === "player") setSynced(true);
      switch (msg.type) {
        case "REQUEST_FULL_STATE":
          if (view === "dm") {
            transport.send({
              type: "FULL_STATE_RESPONSE",
              state: mapStateRef.current!,
            });
          }
          break;
        case "FULL_STATE_RESPONSE":
          if (view === "player") {
            setMapState(msg.state);
            setSynced(true);
          }
          break;
        case "TOKENS_UPDATED":
          setMapState((s) => ({ ...s, tokens: msg.tokens }));
          break;
        case "FOG_UPDATED":
          setMapState((s) => ({ ...s, revealedZones: msg.revealedZones }));
          break;
        case "MAP_LOADED":
          setMapState((s) => ({ ...s, imageDataUrl: msg.imageDataUrl }));
          break;
        case "POINTER_PING":
          pingsRef.current.push({
            id: nextPingIdRef.current++,
            x: msg.x,
            y: msg.y,
            startedAt: performance.now(),
          });
          break;
      }
    });

    if (view === "player") {
      transport.send({ type: "REQUEST_FULL_STATE" });
    }

    const unsubClose = transport.onClose(() => {
      setPeerTransport(null);
      setPeerDisconnected(true);
    });

    return () => {
      unsub();
      unsubClose();
      if (isLocalTransport) {
        transport.close();
      }
    };
  }, [
    view,
    peerTransport,
    mapStateRef,
    transportRef,
    pingsRef,
    nextPingIdRef,
    setMapState,
    setPeerTransport,
    setPeerDisconnected,
  ]);

  return { synced };
}
