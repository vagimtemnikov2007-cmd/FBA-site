const API_URL = "https://fba-server.onrender.com";

const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

async function fetchWithRetry(
    url,
    options = {},
    retries = 3,
    delay = 1500
) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, {
                ...options,
                keepalive: true,
            });

            if (!response.ok) {
                throw new Error(
                    `Request failed: ${response.status}`
                );
            }

            return response;
        } catch (error) {
            lastError = error;

            console.warn(
                `Request attempt ${attempt + 1}/${retries + 1} failed`,
                error
            );

            if (attempt < retries) {
                await sleep(delay * (attempt + 1));
            }
        }
    }

    throw lastError;
}


export async function getAnimations() {
    const response = await fetchWithRetry(
        `${API_URL}/animations`
    );

    return response.json();
}


export async function trackVisitor(visitorId) {
    const response = await fetchWithRetry(
        `${API_URL}/visitors`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                visitorId,
            }),
        }
    );

    return response.json();
}


export async function trackDownload(animationId) {
    const response = await fetchWithRetry(
        `${API_URL}/downloads`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                animationId,
            }),
        }
    );

    return response.json();
}