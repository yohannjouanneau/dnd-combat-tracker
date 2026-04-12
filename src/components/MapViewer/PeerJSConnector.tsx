import { Copy, Loader2, Radio, Wifi, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { PeerJSTransport } from "./PeerJSTransport";
import type { MapTransport } from "./types";

type Step =
  | { kind: "choosing" }
  | { kind: "dm-waiting"; roomCode: string }
  | { kind: "player-ready"; input: string }
  | { kind: "connecting"; input: string }
  | { kind: "error"; message: string };

interface Props {
  onConnected: (transport: MapTransport, role: "dm" | "player") => void;
  onClose: () => void;
}

export default function PeerJSConnector({ onConnected, onClose }: Props) {
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

  const startAsDM = () => {
    const peer = new Peer();
    peerRef.current = peer;

    peer.on("open", (id) => {
      setStep({ kind: "dm-waiting", roomCode: id });
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
  };

  const connectAsPlayer = (roomCode: string) => {
    setStep({ kind: "connecting", input: roomCode });
    const peer = new Peer();
    peerRef.current = peer;

    peer.on("open", () => {
      const conn = peer.connect(roomCode.trim());
      conn.on("open", () => {
        connectedRef.current = true;
        onConnected(new PeerJSTransport(conn), "player");
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

  return (
    <div className="absolute inset-0 z-30 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-panel-bg border border-border-primary rounded-xl p-6 w-full max-w-sm flex flex-col gap-5 relative">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-text-muted hover:text-text-primary transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-text-primary">Connect Online</h2>

        {step.kind === "choosing" && (
          <div className="flex flex-col gap-3">
            <button
              onClick={startAsDM}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-4 rounded-lg transition font-semibold flex items-center gap-3"
            >
              <Radio className="w-5 h-5 shrink-0" />
              <div className="text-left">
                <p>Start as DM</p>
                <p className="text-xs text-red-200 font-normal">
                  Host the session — share a room code
                </p>
              </div>
            </button>
            <button
              onClick={() => setStep({ kind: "player-ready", input: "" })}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-4 rounded-lg transition font-semibold flex items-center gap-3"
            >
              <Wifi className="w-5 h-5 shrink-0" />
              <div className="text-left">
                <p>Join as Player</p>
                <p className="text-xs text-blue-200 font-normal">
                  Enter the room code from the DM
                </p>
              </div>
            </button>
          </div>
        )}

        {step.kind === "dm-waiting" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-7 h-7 text-text-muted animate-spin" />
            <p className="text-text-muted text-sm">
              Waiting for player to connect…
            </p>
            <div className="w-full">
              <p className="text-xs text-text-muted mb-2 text-center">
                Room code
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-panel-secondary text-text-primary px-3 py-2 rounded-lg text-base font-mono tracking-widest text-center select-all">
                  {step.roomCode}
                </code>
                <button
                  onClick={() => copyRoomCode(step.roomCode)}
                  className="bg-panel-secondary hover:bg-panel-secondary/70 text-text-primary p-2 rounded-lg transition"
                  title="Copy room code"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied && (
                <p className="text-xs text-green-400 text-center mt-1">
                  Copied!
                </p>
              )}
            </div>
            <button
              onClick={reset}
              className="text-xs text-text-muted hover:text-text-primary transition"
            >
              Cancel
            </button>
          </div>
        )}

        {(step.kind === "player-ready" || step.kind === "connecting") && (
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={step.input}
              onChange={(e) =>
                setStep({ kind: "player-ready", input: e.target.value })
              }
              placeholder="Paste room code from DM…"
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
            <button
              onClick={() =>
                step.kind === "player-ready" && connectAsPlayer(step.input)
              }
              disabled={!step.input.trim() || step.kind === "connecting"}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition font-semibold flex items-center justify-center gap-2"
            >
              {step.kind === "connecting" && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {step.kind === "connecting" ? "Connecting…" : "Connect"}
            </button>
            <button
              onClick={reset}
              className="text-xs text-text-muted hover:text-text-primary transition text-center"
            >
              Cancel
            </button>
          </div>
        )}

        {step.kind === "error" && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-red-400 font-semibold text-sm">
              Connection failed
            </p>
            <p className="text-text-muted text-xs text-center">
              {step.message}
            </p>
            <button
              onClick={reset}
              className="bg-panel-secondary hover:bg-panel-secondary/70 text-text-primary px-4 py-2 rounded-lg transition text-sm"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
