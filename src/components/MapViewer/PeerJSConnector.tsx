import { Copy, Loader2, Monitor, Radio, Wifi, X } from "lucide-react";
import Button from "../common/Button";
import IconButton from "../common/IconButton";
import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { useTranslation } from "react-i18next";
import { PeerJSTransport } from "./PeerJSTransport";
import type { MapTransport } from "./types";

type Step =
  | { kind: "choosing" }
  | { kind: "dm-waiting"; roomCode: string }
  | { kind: "player-ready"; input: string }
  | { kind: "connecting"; input: string }
  | { kind: "error"; message: string };

interface Props {
  onConnected: (
    transport: MapTransport,
    role: "dm" | "player",
    roomCode?: string,
  ) => void;
  onOpenLocalView: () => void;
  onClose: () => void;
}

export default function PeerJSConnector({
  onConnected,
  onOpenLocalView,
  onClose,
}: Props) {
  const { t } = useTranslation("map");
  const [step, setStep] = useState<Step>({ kind: "choosing" });
  const [copied, setCopied] = useState(false);
  const peerRef = useRef<InstanceType<typeof Peer> | null>(null);
  // Once a connection is established, PeerJSTransport owns the peer's lifecycle.
  // Prevent the cleanup below from destroying it prematurely on unmount.
  const connectedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (!connectedRef.current) {
        peerRef.current?.destroy();
      }
    };
  }, []);

  const reset = () => {
    peerRef.current?.destroy();
    peerRef.current = null;
    setStep({ kind: "choosing" });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      const peer = peerRef.current;
      if (!peer || peer.destroyed) return;
      if (peer.disconnected && step.kind === "dm-waiting") {
        peer.reconnect();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [step.kind]);

  const startAsDM = () => {
    const peer = new Peer();
    peerRef.current = peer;

    peer.on("open", (id) => {
      // Also fires after peer.reconnect(). Skip update only if ID is unchanged —
      // if the server assigned a new ID, update the displayed room code.
      setStep((prev) =>
        prev.kind === "dm-waiting" && prev.roomCode === id
          ? prev
          : { kind: "dm-waiting", roomCode: id },
      );
    });

    peer.on("connection", (conn) => {
      conn.on("open", () => {
        connectedRef.current = true;
        onConnected(new PeerJSTransport(conn), "dm");
      });
      conn.on("error", (err) => {
        setStep({ kind: "error", message: err.message });
      });
    });

    peer.on("error", (err) => {
      setStep({ kind: "error", message: err.message });
    });

    // Silently reconnect to the signaling server when the WebSocket drops
    // (e.g. iOS Safari backgrounding). peer.id is preserved across disconnects.
    peer.on("disconnected", () => {
      if (!peer.destroyed) {
        peer.reconnect();
      }
    });
  };

  const connectAsPlayer = (roomCode: string) => {
    setStep({ kind: "connecting", input: roomCode });
    const peer = new Peer();
    peerRef.current = peer;

    peer.on("open", () => {
      const conn = peer.connect(roomCode.trim());
      conn.on("open", () => {
        connectedRef.current = true;
        onConnected(new PeerJSTransport(conn), "player", roomCode.trim());
      });
      conn.on("error", (err) => {
        setStep({ kind: "error", message: err.message });
      });
    });

    peer.on("error", (err) => {
      setStep({ kind: "error", message: err.message });
    });
  };

  const copyRoomCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const networkWarning = (
    <p className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2 w-full text-center">
      {t("connector.sameNetworkWarning")}
    </p>
  );

  return (
    <div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-panel-bg border border-border-primary rounded-xl p-6 w-full max-w-sm flex flex-col gap-5 relative">
        <IconButton
          variant="ghost"
          onClick={handleClose}
          className="absolute top-3 right-3"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </IconButton>

        <h2 className="text-lg font-bold text-text-primary">
          {t("connector.title")}
        </h2>

        {step.kind === "choosing" && (
          <div className="flex flex-col gap-3">
            <Button
              variant="danger"
              size="lg"
              onClick={startAsDM}
              className="rounded-lg flex items-center gap-3 font-semibold"
            >
              <Radio className="w-5 h-5 shrink-0" />
              <span className="text-left">
                <p>{t("connector.startAsDm")}</p>
                <p className="text-xs text-red-200 font-normal">
                  {t("connector.startAsDmHint")}
                </p>
              </span>
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setStep({ kind: "player-ready", input: "" })}
              className="rounded-lg flex items-center gap-3 font-semibold"
            >
              <Wifi className="w-5 h-5 shrink-0" />
              <span className="text-left">
                <p>{t("connector.joinAsPlayer")}</p>
                <p className="text-xs text-blue-200 font-normal">
                  {t("connector.joinAsPlayerHint")}
                </p>
              </span>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                onOpenLocalView();
                onClose();
              }}
              className="rounded-lg flex items-center gap-3 font-semibold hover:bg-panel-secondary/70"
            >
              <Monitor className="w-5 h-5 shrink-0" />
              <span className="text-left">
                <p>{t("connector.openLocalView")}</p>
                <p className="text-xs text-text-muted font-normal">
                  {t("connector.openLocalViewHint")}
                </p>
              </span>
            </Button>
          </div>
        )}

        {step.kind === "dm-waiting" && (
          <div className="flex flex-col items-center gap-4">
            {networkWarning}
            <Loader2 className="w-7 h-7 text-text-muted animate-spin" />
            <p className="text-text-muted text-sm">
              {t("connector.waitingForPlayer")}
            </p>
            <div className="w-full">
              <p className="text-xs text-text-muted mb-2 text-center">
                {t("connector.roomCode")}
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-panel-secondary text-text-primary px-3 py-2 rounded-lg text-base font-mono tracking-widest text-center select-all">
                  {step.roomCode}
                </code>
                <IconButton
                  onClick={() => copyRoomCode(step.roomCode)}
                  title={t("connector.copyRoomCode")}
                  className="rounded-lg"
                >
                  <Copy className="w-4 h-4" />
                </IconButton>
              </div>
              {copied && (
                <p className="text-xs text-green-400 text-center mt-1">
                  {t("connector.copied")}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="text-xs"
            >
              {t("connector.cancel")}
            </Button>
          </div>
        )}

        {(step.kind === "player-ready" || step.kind === "connecting") && (
          <div className="flex flex-col gap-3">
            {networkWarning}
            <input
              type="text"
              value={step.input}
              onChange={(e) =>
                setStep({ kind: "player-ready", input: e.target.value })
              }
              placeholder={t("connector.roomCodePlaceholder")}
              disabled={step.kind === "connecting"}
              className="bg-panel-secondary text-text-primary px-3 py-2 rounded-lg font-mono text-center tracking-widest border border-border-primary focus:outline-none focus:border-blue-500 disabled:opacity-50"
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  step.kind === "player-ready" &&
                  step.input.trim()
                ) {
                  connectAsPlayer(step.input);
                }
              }}
              autoFocus
            />
            <Button
              variant="primary"
              onClick={() =>
                step.kind === "player-ready" && connectAsPlayer(step.input)
              }
              disabled={!step.input.trim() || step.kind === "connecting"}
              className="rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              {step.kind === "connecting" && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {step.kind === "connecting"
                ? t("connector.connecting")
                : t("connector.connect")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="text-xs text-center"
            >
              {t("connector.cancel")}
            </Button>
          </div>
        )}

        {step.kind === "error" && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-red-400 font-semibold text-sm">
              {t("connector.connectionFailed")}
            </p>
            <p className="text-text-muted text-xs text-center">
              {step.message}
            </p>
            <Button variant="secondary" onClick={reset}>
              {t("connector.tryAgain")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
