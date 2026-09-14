import { useState, useEffect } from "react";
import Card from "../components/Card/Card";
import {getAnimations} from '../service/api'
import "./Animations.css"
function AnimationsPage() {
    const [animations, setAnimations] = useState([]);

    useEffect(() => {
        async function loadAnimations() {
        try {
            const data = await getAnimations();
            setAnimations(data)
        } catch (error) {
            console.error("Failed to load animations:", error)
        }       
    }

    loadAnimations();
    },[])

    return(
        <>
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
        </>
    )
}

export default AnimationsPage