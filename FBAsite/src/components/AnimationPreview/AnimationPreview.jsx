import { useEffect, useRef, useState } from "react";
import { loadAnimation } from "../../animation/assets";
import "./AnimationPreview.css";

export default function AnimationPreview({ sourceUrl, name, playing = false }) {
    const container = useRef(null), canvas = useRef(null), controller = useRef(null);
    const playingRef = useRef(false);
    const [active, setActive] = useState(false);
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState(null);
    const [attempt, setAttempt] = useState(0);
    const [reducedMotion, setReducedMotion] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);

    useEffect(() => {
        const media = matchMedia("(prefers-reduced-motion: reduce)");
        const change = event => setReducedMotion(event.matches);
        media.addEventListener("change", change);
        return () => media.removeEventListener("change", change);
    }, []);

    useEffect(() => {
        playingRef.current = playing && !reducedMotion;
        if (playingRef.current) controller.current?.play();
        else controller.current?.rest();
    }, [playing, reducedMotion]);

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) { setActive(true); observer.disconnect(); }
        }, { rootMargin: "150px" });
        observer.observe(container.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!active) return;
        let cancelled = false, handle;
        (async () => {
            try {
                if (!sourceUrl) throw new Error("Animation JSON is unavailable");
                const animation = await loadAnimation(sourceUrl, { refresh: attempt > 0, allowImported: false });
                if (cancelled) return;
                const { getPreviewEngine } = await import("../../animation/engine");
                if (cancelled) return;
                handle = getPreviewEngine().add(canvas.current, animation, {
                    loop: true,
                    onError: message => { if (!cancelled) setError(message); },
                });
                controller.current = handle;
                if (playingRef.current) handle.play();
                setError(null); setStatus("ready");
            } catch (failure) {
                if (!cancelled) { setError(failure.message); setStatus("error"); }
            }
        })();
        return () => { cancelled = true; handle?.dispose(); controller.current = null; };
    }, [active, attempt, sourceUrl]);

    function retry() {
        setError(null); setStatus("loading"); setAttempt(value => value + 1);
    }

    return (
        <div className="animation-preview" ref={container} data-state={status} aria-label={"3D preview of " + name}>
            <div className="animation-preview-shadow" aria-hidden="true" />
            <canvas ref={canvas} className="animation-preview-canvas" aria-hidden="true" />
            {status !== "ready" && <svg className="animation-preview-placeholder" viewBox="0 0 120 132" aria-hidden="true">
                <path d="M60 8 110 35 60 63 10 35Z" fill="#8db55f" />
                <path d="M10 35 60 63 60 122 10 93Z" fill="#8e7048" />
                <path d="M60 63 110 35 110 93 60 122Z" fill="#70583b" />
                <path d="M10 35 60 63 60 77 49 68 40 72 30 59 19 62 10 53Z" fill="#6d984c" />
                <path d="M60 63 110 35 110 49 101 51 94 64 85 61 76 77 67 73 60 82Z" fill="#587f3b" />
            </svg>}
            {error && <div className="animation-preview-error" role="status" title={error}>
                <span>Preview unavailable</span><button type="button" onClick={retry}>Retry</button>
            </div>}
        </div>
    );
}
