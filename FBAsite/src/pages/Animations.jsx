import { useState, useEffect, useMemo, useRef } from "react";
import Card from "../components/Card/Card";
import { getAnimations } from "../service/api";
import { sortAnimations } from "../service/SortAnimations";
import "./Animations.css";
import { readCatalog, storeCatalog } from "../animation/storage";

const RETRY_COUNT = 3;
const RETRY_DELAY = 1500;
const INITIAL_VISIBLE_COUNT = 12;
const LOAD_MORE_COUNT = 6;
const LOAD_MORE_DISTANCE = 150;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getAnimationsWithRetry() {
    let lastError;

    for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
        try {
            return await getAnimations();
        } catch (error) {
            lastError = error;

            console.warn(
                `Failed to load animations. Attempt ${attempt}/${RETRY_COUNT}`,
                error
            );

            if (attempt < RETRY_COUNT) {
                await sleep(RETRY_DELAY * attempt);
            }
        }
    }

    throw lastError;
}

function AnimationResults({ animations }) {
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
    const sentinel = useRef(null);
    const hasMore = visibleCount < animations.length;

    useEffect(() => {
        if (!hasMore) return;
        const target = sentinel.current;
        let previousScrollY = window.scrollY, touchY = null, scrolledDown = false, triggered = false, observer;

        function stopObserving() {
            observer?.disconnect();
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("wheel", onWheel);
            window.removeEventListener("touchstart", onTouchStart);
            window.removeEventListener("touchmove", onTouchMove);
        }

        function loadWhenVisible() {
            if (triggered || !scrolledDown) return;
            const bounds = target.getBoundingClientRect();
            if (bounds.top > window.innerHeight + LOAD_MORE_DISTANCE || bounds.bottom < 0) return;
            triggered = true;
            stopObserving();
            setVisibleCount(count => Math.min(count + LOAD_MORE_COUNT, animations.length));
        }
        function onScroll() {
            if (window.scrollY > previousScrollY) scrolledDown = true;
            previousScrollY = window.scrollY;
            loadWhenVisible();
        }
        function onWheel(event) {
            if (event.deltaY <= 0) return;
            scrolledDown = true;
            loadWhenVisible();
        }
        function onTouchStart(event) { touchY = event.touches[0]?.clientY ?? null; }
        function onTouchMove(event) {
            const nextY = event.touches[0]?.clientY;
            if (touchY !== null && nextY < touchY) { scrolledDown = true; loadWhenVisible(); }
            touchY = nextY ?? null;
        }

        // Keep the first batch at 12 until the visitor actually scrolls down.
        // Disconnect after one batch to avoid repeated callbacks loading the whole catalog.
        if (typeof IntersectionObserver !== "undefined") {
            observer = new IntersectionObserver(loadWhenVisible, { rootMargin: `0px 0px ${LOAD_MORE_DISTANCE}px 0px` });
            observer.observe(target);
        }
        window.addEventListener("scroll", onScroll, { passive: true });
        // Wheel/touch intent still works at the scroll boundary after a filter reset,
        // or when the first twelve cards fit entirely inside a tall viewport.
        window.addEventListener("wheel", onWheel, { passive: true });
        window.addEventListener("touchstart", onTouchStart, { passive: true });
        window.addEventListener("touchmove", onTouchMove, { passive: true });
        return stopObserving;
    }, [hasMore, visibleCount, animations.length]);

    return (
        <div className="animations-results">
            <div className="animations-container">
                {animations.slice(0, visibleCount).map(animation => (
                    <Card
                        key={animation.id}
                        id={animation.id}
                        name={animation.name}
                        author={animation.author}
                        animationUrl={animation.animation_url || animation.json_url}
                        downloadUrl={animation.download_url}
                        created_at={animation.created_at}
                    />
                ))}
            </div>
            {hasMore && <div className="animations-load-more" ref={sentinel}>
                <button type="button" onClick={() => setVisibleCount(count => Math.min(count + LOAD_MORE_COUNT, animations.length))}>
                    Load more animations
                </button>
            </div>}
        </div>
    );
}

function AnimationsPage({ sortType, searchQuery }) {
    const [animations, setAnimations] = useState(() =>
        readCatalog()
    );

    const [loading, setLoading] = useState(animations.length === 0);
    const [error, setError] = useState(false);

    function loadAnimations() {
        return getAnimationsWithRetry().then(data => {
            if (!Array.isArray(data)) throw new Error("Invalid animation catalog");

            setAnimations(data);

            storeCatalog(data);
        }).catch(error => {
            console.error("Failed to load animations:", error);
            setError(true);
        }).finally(() => setLoading(false));
    }

    useEffect(() => {
        loadAnimations();
    }, []);

    function retryLoad() {
        setError(false); setLoading(true); loadAnimations();
    }

    const filteredAnimations = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) {
            return animations;
        }

        return animations.filter((animation) =>
            animation.name.toLowerCase().includes(query)
        );
    }, [animations, searchQuery]);

    const sortedAnimations = useMemo(() => {
        return sortAnimations(filteredAnimations, sortType);
    }, [filteredAnimations, sortType]);

    if (loading && animations.length === 0) {
        return (
            <div className="animations-status">
                Loading animations...
            </div>
        );
    }

    if (error && animations.length === 0) {
        return (
            <div className="animations-status">
                <p>Failed to load animations.</p>
                <button onClick={retryLoad}>
                    Try again
                </button>
            </div>
        );
    }

    return (
        <AnimationResults
            key={JSON.stringify([sortType, searchQuery.trim().toLowerCase()])}
            animations={sortedAnimations}
        />
    );
}

export default AnimationsPage;
