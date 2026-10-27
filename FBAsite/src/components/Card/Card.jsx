import { useId, useState } from "react";
import "./Card.css";
import { trackDownload } from "../../service/api";
import AnimationPreview from "../AnimationPreview/AnimationPreview";

function Card({ id, name, author, animationUrl, downloadUrl, created_at }) {
    const titleId = useId();
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const [openedAt] = useState(Date.now);
    const playing = hovered || focused;

    const createdDate = new Date(created_at);
    const hasDate = !Number.isNaN(createdDate.getTime());
    const age = openedAt - createdDate;
    const isNew = hasDate && age >= 0 && age < 7 * 24 * 60 * 60 * 1000;

    function handleDownload() {
        trackDownload(id).catch(error => console.error("Failed to track download:", error));
    }
    function pointerEnter(event) {
        if (event.pointerType !== "touch") setHovered(true);
    }
    function pointerLeave(event) {
        if (event.pointerType !== "touch") { setHovered(false); setFocused(false); }
    }
    function pointerDown(event) {
        if (event.pointerType === "touch" && !event.target.closest("a, button")) event.currentTarget.focus({ preventScroll: true });
    }

    return (
        <article className="card" tabIndex={0} aria-labelledby={titleId} data-playing={playing}
            onPointerEnter={pointerEnter} onPointerLeave={pointerLeave} onPointerDown={pointerDown}
            onFocusCapture={() => setFocused(true)}
            onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
            <AnimationPreview key={animationUrl || downloadUrl} sourceUrl={animationUrl || downloadUrl} name={name} playing={playing} />
            {isNew && <span className="new-badge">NEW</span>}
            <div className="card-info">
                <h2 id={titleId}>{name}</h2>
                <p className="card-author">by <span>{author}</span></p>
                {hasDate && <time className="card-date" dateTime={createdDate.toISOString()}>
                    {createdDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </time>}
                <a className="download-button" href={downloadUrl} target="_blank" rel="noopener noreferrer" onClick={handleDownload}>
                    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M10 3v9m-3-3 3 3 3-3M4 13v3h12v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Download
                </a>
            </div>
        </article>
    );
}
export default Card;
