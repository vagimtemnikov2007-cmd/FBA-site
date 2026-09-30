const API_URL = "https://fba-server.onrender.com";


// ---------------------------------
// GET VISITOR ID
// ---------------------------------

function getVisitorId() {
    const visitorId = localStorage.getItem("visitorID");

    if (!visitorId) {
        throw new Error(
            "visitorId not found in localStorage"
        );
    }

    return visitorId;
}


// ---------------------------------
// REGISTER ADMIN
// ---------------------------------

export async function registerAdmin(adminKey) {
    if (!adminKey?.trim()) {
        throw new Error(
            "Admin key is required"
        );
    }

    const visitorId = getVisitorId();

    const response = await fetch(
        `${API_URL}/admin/register`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
            },

            body: JSON.stringify({
                adminKey: adminKey.trim(),
                visitorId,
            }),
        }
    );


    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error(
            `Invalid server response (${response.status})`
        );
    }


    if (!response.ok) {
        throw new Error(
            data.error ||
            `Admin registration failed (${response.status})`
        );
    }


    return data;
}


// ---------------------------------
// CHECK ADMIN
// ---------------------------------

export async function checkAdmin() {
    const visitorId = getVisitorId();

    const response = await fetch(
        `${API_URL}/admin/check`,
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


    const data = await response.json();


    if (!response.ok) {
        throw new Error(
            data.error ||
            "Failed to check admin status"
        );
    }


    return data.admin;
}