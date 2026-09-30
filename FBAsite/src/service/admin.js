const API_URL = "https://fba-server.onrender.com";




function getVisitorId() {
    const visitorId = localStorage.getItem("visitorID");

    if (!visitorId) {
        throw new Error(
            "visitorId not found in localStorage"
        );
    }

    return visitorId;
}




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

export async function addAdminAnimation({
    name,
    author,
    mail,
    file,
}) {
    const visitorId =
        localStorage.getItem("visitorID");

    if (!visitorId) {
        throw new Error(
            "visitorID not found"
        );
    }

    const formData = new FormData();

    formData.append("name", name.trim());
    formData.append("author", author.trim());
    formData.append("mail", mail.trim());
    formData.append("file", file);
    formData.append("visitorId", visitorId);

    const response = await fetch(
        `${API_URL}/admin/animations`,
        {
            method: "POST",
            body: formData,
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
            "Failed to add animation"
        );
    }

    return data;
}

export async function getSubmissions() {
    const visitorId =
        localStorage.getItem("visitorID");

    if (!visitorId) {
        throw new Error(
            "visitorID not found"
        );
    }

    const response = await fetch(
        `${API_URL}/admin/submissions`,
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
            "Failed to load submissions"
        );
    }

    return data.submissions;
}