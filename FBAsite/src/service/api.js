const API_URL = "https://fba-server.onrender.com";

const sleep = (ms) => {
    return new Promise((resolve) =>
        setTimeout(resolve, ms)
    );
};


let animationsRequest = null;



async function fetchWithRetry(
    url,
    options = {},
    attempts = 3,
    delays = [5000, 10000]
) {
    let lastError;

    for (
        let attempt = 0;
        attempt < attempts;
        attempt++
    ) {
        try {
            const response = await fetch(
                url,
                options
            );

            if (
                response.status >= 400 &&
                response.status < 500
            ) {
                throw new Error(
                    `Request failed: ${response.status}`
                );
            }

            if (!response.ok) {
                throw new Error(
                    `Server unavailable: ${response.status}`
                );
            }

            return response;

        } catch (error) {
            lastError = error;

            console.warn(
                `Request ${attempt + 1}/${attempts} failed:`,
                error.message
            );

            const isLastAttempt =
                attempt === attempts - 1;

            if (isLastAttempt) {
                break;
            }

            const delay =
                delays[attempt] ?? 10000;

            console.log(
                `Retrying in ${delay / 1000}s...`
            );

            await sleep(delay);
        }
    }

    throw lastError;
}



export function getAnimations() {

    if (animationsRequest) {
        console.log(
            "Animations request already running"
        );

        return animationsRequest;
    }


    animationsRequest = (async () => {
        try {
            const response =
                await fetchWithRetry(
                    `${API_URL}/animations`,
                    {},
                    3,
                    [
                        5000,
                        10000,
                    ]
                );

            return await response.json();

        } finally {

            animationsRequest = null;
        }
    })();

    return animationsRequest;
}


export async function trackVisitor(visitorId) {
    try {
        const response = await fetch(
            `${API_URL}/visitors`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body: JSON.stringify({
                    visitorId,
                }),
            }
        );


        if (!response.ok) {
            throw new Error(
                `Visitor tracking failed: ${response.status}`
            );
        }


        return await response.json();

    } catch (error) {

        console.warn(
            "Visitor tracking failed:",
            error.message
        );

        return null;
    }
}



export async function trackDownload(
    animationId
) {
    try {
        const response = await fetch(
            `${API_URL}/downloads`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body: JSON.stringify({
                    animationId,
                }),

                keepalive: true,
            }
        );


        if (!response.ok) {
            throw new Error(
                `Download tracking failed: ${response.status}`
            );
        }


        return await response.json();

    } catch (error) {
        console.warn(
            "Download tracking failed:",
            error.message
        );

        return null;
    }
}