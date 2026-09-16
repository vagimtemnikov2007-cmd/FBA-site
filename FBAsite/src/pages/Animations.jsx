import { useState, useEffect } from "react";
import Card from "../components/Card/Card";
import { getAnimations } from "../service/api";
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

function AnimationsPage() {
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
                        data: data
                    })
                );
            } catch (error) {
                console.error("Failed to load animations:", error);
            }
        }

        loadAnimations();
    }, []);

    return (
        <div className="animations-container">
            {animations.map((animation) => (
                <Card
                    key={animation.id}
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