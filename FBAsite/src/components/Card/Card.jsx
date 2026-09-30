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
            console.error(
                "Failed to track download:",
                error
            );
        });
    };


    const createdDate =
        new Date(created_at);

    const now =
        new Date();

    const differenceMs =
        now - createdDate;

    const sevenDaysMs =
        7 * 24 * 60 * 60 * 1000;

    const isNew =
        differenceMs >= 0 &&
        differenceMs < sevenDaysMs;


    return (
        <div className="card">

            {isNew && (
                <div className="new-badge">
                    NEW
                </div>
            )}

            <h2>
                {name}
            </h2>

            <p>
                by {author}
            </p>

            <p>
                publish:{" "}
                {createdDate.toLocaleDateString("en-US")}
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