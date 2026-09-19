import { useState, useEffect, useMemo } from "react";
import Card from "../components/Card/Card";
import { getAnimations } from "../service/api";
import { sortAnimations } from "../service/SortAnimations";
import "./Animations.css";

const CACHE_KEY = "fba_animations";
const CACHE_VERSION = 1;

const RETRY_COUNT = 3;
const RETRY_DELAY = 1500;

function getCachedAnimations() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);

        if (!cached) {
            return [];
        }

        const parsed = JSON.parse(cached);

        if (parsed.version !== CACHE_VERSION) {
            localStorage.removeItem(CACHE_KEY);
            return [];
        }

        return parsed.data ?? [];
    } catch (error) {
        console.error("Failed to read animations cache:", error);
        localStorage.removeItem(CACHE_KEY);
        return [];
    }
}

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

function AnimationsPage({ sortType, searchQuery }) {
    const [animations, setAnimations] = useState(() =>
        getCachedAnimations()
    );

    const [loading, setLoading] = useState(animations.length === 0);
    const [error, setError] = useState(false);

    async function loadAnimations() {
        try {
            setError(false);

            const data = await getAnimationsWithRetry();

            setAnimations(data);

            localStorage.setItem(
                CACHE_KEY,
                JSON.stringify({
                    version: CACHE_VERSION,
                    updatedAt: Date.now(),
                    data
                })
            );
        } catch (error) {
            console.error("Failed to load animations:", error);
            setError(true);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAnimations();
    }, []);

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
                <button onClick={loadAnimations}>
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className="animations-container">
            {sortedAnimations.map((animation) => (
                <Card
                    key={animation.id}
                    id={animation.id}
                    name={animation.name}
                    author={animation.author}
                    previewUrl={animation.preview_url}
                    downloadUrl={animation.download_url}
                    created_at={animation.created_at}
                />
            ))}
        </div>
    );
}

export default AnimationsPage;