import { useEffect, useRef, useState, RefObject } from "react";
import { CameraOff, Loader2 } from "lucide-react";

interface Props {
  localVideoRef: RefObject<HTMLDivElement>;
  isCameraOff: boolean;
  joining: boolean;
}

const W = 112; // w-28
const H = 160; // h-40
const MARGIN = 16;

const DraggableSelfVideo = ({ localVideoRef, isCameraOff, joining }: Props) => {
  // Default: bottom-right, above pill control bar (~bottom 112px)
  const [pos, setPos] = useState(() => ({
    x: window.innerWidth - W - MARGIN,
    y: window.innerHeight - H - 112,
  }));
  const dragRef = useRef<{ dx: number; dy: number; dragging: boolean }>({
    dx: 0,
    dy: 0,
    dragging: false,
  });

  const clamp = (x: number, y: number) => ({
    x: Math.max(MARGIN, Math.min(window.innerWidth - W - MARGIN, x)),
    y: Math.max(MARGIN + 40, Math.min(window.innerHeight - H - MARGIN, y)),
  });

  useEffect(() => {
    const onResize = () => setPos((p) => clamp(p.x, p.y));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      dx: e.clientX - pos.x,
      dy: e.clientY - pos.y,
      dragging: true,
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return;
    const next = clamp(e.clientX - dragRef.current.dx, e.clientY - dragRef.current.dy);
    setPos(next);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    dragRef.current.dragging = false;
    // Snap to nearest horizontal edge (WhatsApp style)
    setPos((p) => {
      const snapX =
        p.x + W / 2 < window.innerWidth / 2
          ? MARGIN
          : window.innerWidth - W - MARGIN;
      return clamp(snapX, p.y);
    });
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        left: pos.x,
        top: pos.y,
        width: W,
        height: H,
        touchAction: "none",
        transition: dragRef.current.dragging ? "none" : "left 0.2s ease, top 0.2s ease",
      }}
      className="fixed rounded-2xl overflow-hidden border border-primary-foreground/20 shadow-2xl z-20 cursor-grab active:cursor-grabbing"
    >
      <div ref={localVideoRef} className="w-full h-full bg-foreground/80 pointer-events-none">
        {(isCameraOff || joining) && (
          <div className="w-full h-full flex items-center justify-center">
            {joining ? (
              <Loader2 className="text-primary-foreground/50 animate-spin" size={24} />
            ) : (
              <CameraOff className="text-primary-foreground/50" size={24} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DraggableSelfVideo;
