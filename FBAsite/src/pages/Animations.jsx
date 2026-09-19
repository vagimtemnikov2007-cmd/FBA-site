import { useState, useEffect, useMemo } from "react";
import Card from "../components/Card/Card";
import { getAnimations } from "../service/api";
import { sortAnimations } from "../service/SortAnimations";
import "./Animations.css";

const CACHE_KEY = "fba_animations";
const CACHE_VERSION = 1;

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

function AnimationsPage({ sortType, searchQuery }) {
    const [animations, setAnimations] = useState(() =>
        getCachedAnimations()
    );

    

    useEffect(() => {
        async function loadAnimations() {
            try {
                const data = await getAnimations();

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
            }
        }

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

    return (
        <div className="animations-container">
            {sortedAnimations.map((animation) => (
                <Card
                    key={animation.id}
                    id= {animation.id}
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