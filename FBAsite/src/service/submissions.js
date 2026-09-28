const API_URL = "https://fba-server.onrender.com";

export async function submitAnimation({
    name,
    author,
    mail,
    file,
}) {
    const formData = new FormData();

    formData.append("name", name.trim());
    formData.append("author", author.trim());
    formData.append("mail", mail.trim());
    formData.append("file", file);

    const response = await fetch(
        `${API_URL}/submitAnimation`,
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
            `Server returned invalid response (${response.status})`
        );
    }

    if (!response.ok) {
        throw new Error(
            data.error || "Failed to submit animation"
        );
    }

    return data;
}