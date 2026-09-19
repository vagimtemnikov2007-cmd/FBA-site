import "./Card.css";
import { trackDownload } from "../../service/api";

function Card({
    id,
    name,
    author,
    previewUrl,
    downloadUrl,
    created_at
}) {
    const handleDownload = () => {
        trackDownload(id).catch((error) => {
            console.error("Failed to track download:", error);
        });
    };

    return (
        <div className="card">
            <h2>{name}</h2>

            <p>by {author}</p>

            <p>
                publish: {new Date(created_at).toLocaleDateString("en-US")}
            </p>

            <video
                src={previewUrl}
                autoPlay
                loop
                muted
            />

            <a
                className="download-button"
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDownload}
            >
                Download
            </a>
        </div>
    );
}

export default Card;