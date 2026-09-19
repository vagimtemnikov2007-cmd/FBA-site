const API_URL = "https://fba-server.onrender.com"

export async function getAnimations() {
    const  response = await fetch(`${API_URL}/animations`)


if (!response.ok) {
    throw new Error(`Failed to fetch animations: ${response.status}`)
}

return response.json()
}

export async function trackDownload(animationId) {
    const response = await fetch(`${API_URL}/downloads`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            animationId,
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to track download");
    }

    return response.json();
}