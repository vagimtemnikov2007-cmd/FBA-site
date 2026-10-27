import { useState, useEffect, useMemo } from "react";
import Card from "../components/Card/Card";
import { getAnimations } from "../service/api";
import { sortAnimations } from "../service/SortAnimations";
import "./Animations.css";
import { readCatalog, storeCatalog } from "../animation/storage";

const RETRY_COUNT = 3;
const RETRY_DELAY = 1500;

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
        <div className="animations-container">
            {sortedAnimations.map((animation) => (
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
    );
}

export default AnimationsPage;
