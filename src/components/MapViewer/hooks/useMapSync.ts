import Peer from "peerjs";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../../common/Toast/useToast";
import { BroadcastChannelTransport } from "../BroadcastChannelTransport";
import { PeerJSTransport } from "../PeerJSTransport";
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
  setIsReconnecting: React.Dispatch<React.SetStateAction<boolean>>;
  onCenterCamera: (x: number, y: number) => void;
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
  setIsReconnecting,
  onCenterCamera,
}: Params): { synced: boolean; reconnectToRoom: (roomCode: string) => void } {
  const [synced, setSynced] = useState(view === "dm");
  const toast = useToast();
  const { t } = useTranslation("map");

  const reconnectToRoom = useCallback(
    (roomCode: string) => {
      setIsReconnecting(true);
      const peer = new Peer();
      peer.on("open", () => {
        const conn = peer.connect(roomCode);
        conn.on("open", () => {
          setPeerTransport(new PeerJSTransport(conn));
          setPeerDisconnected(false);
          setIsReconnecting(false);
        });
        conn.on("error", (err) => {
          peer.destroy();
          setIsReconnecting(false);
          toast.error(`${t("overlay.reconnectFailed")}: ${err.type}`);
        });
      });
      peer.on("error", (err) => {
        peer.destroy();
        setIsReconnecting(false);
        toast.error(`${t("overlay.reconnectFailed")}: ${err.type}`);
      });
    },
    [toast, t, setIsReconnecting, setPeerTransport, setPeerDisconnected],
  );

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
        case "FOCUS_TOKEN":
          if (view === "player") onCenterCamera(msg.x, msg.y);
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
    onCenterCamera,
  ]);

  return { synced, reconnectToRoom };
}
