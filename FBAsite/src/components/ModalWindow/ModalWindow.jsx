import { useState } from "react";
import "./ModalWindow.css";

import { submitAnimation } from "../../service/submissions";

function ModalWindow({
    isOpenModal,
    setIsOpenModal,
}) {
    const [name, setName] = useState("");
    const [author, setAuthor] = useState("");
    const [mail, setMail] = useState("");
    const [file, setFile] = useState(null);

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    function closeModal() {
        if (isSubmitting) {
            return;
        }

        setIsOpenModal(false);
        setError("");
        setSuccess("");
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!name.trim()) {
            setError("Enter animation name");
            return;
        }

        if (!author.trim()) {
            setError("Enter author name");
            return;
        }

        if (!mail.trim()) {
            setError("Enter your email");
            return;
        }

        if (!file) {
            setError("Select animation JSON file");
            return;
        }

        if (!file.name.toLowerCase().endsWith(".json")) {
            setError("Only .json files are allowed");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setError("Maximum file size is 2 MB");
            return;
        }

        try {
            setIsSubmitting(true);

            const result = await submitAnimation({
                name,
                author,
                mail,
                file,
            });

            console.log(
                "Animation submitted:",
                result
            );

            setSuccess(
                "Animation submitted successfully!"
            );

            setName("");
            setAuthor("");
            setMail("");
            setFile(null);

            const fileInput =
                document.querySelector(
                    "#animation-file"
                );

            if (fileInput) {
                fileInput.value = "";
            }

        } catch (error) {
            console.error(
                "Submit animation failed:",
                error
            );

            setError(
                error.message ||
                "Failed to submit animation"
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div
            className={`modal ${
                isOpenModal ? "open" : "closed"
            }`}
        >
            <div className="modal-content">
                <h2>
                    Submit Animation
                </h2>

                <form onSubmit={handleSubmit}>

                    <label>
                        Animation name
                    </label>

                    <input
                        type="text"
                        placeholder="My animation"
                        value={name}
                        disabled={isSubmitting}
                        onChange={(event) =>
                            setName(event.target.value)
                        }
                    />


                    <label>
                        Author
                    </label>

                    <input
                        type="text"
                        placeholder="Your name"
                        value={author}
                        disabled={isSubmitting}
                        onChange={(event) =>
                            setAuthor(event.target.value)
                        }
                    />


                    <label>
                        Email
                    </label>

                    <input
                        type="email"
                        placeholder="example@mail.com"
                        value={mail}
                        disabled={isSubmitting}
                        onChange={(event) =>
                            setMail(event.target.value)
                        }
                    />


                    <label>
                        Animation JSON
                    </label>

                    <input
                        id="animation-file"
                        type="file"
                        accept=".json,application/json"
                        disabled={isSubmitting}
                        onChange={(event) => {
                            const selectedFile =
                                event.target.files?.[0];

                            setFile(
                                selectedFile || null
                            );
                        }}
                    />


                    {file && (
                        <p className="selected-file">
                            Selected: {file.name}
                        </p>
                    )}


                    {error && (
                        <p className="modal-error">
                            {error}
                        </p>
                    )}


                    {success && (
                        <p className="modal-success">
                            {success}
                        </p>
                    )}


                    <div className="modal-buttons">

                        <button
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? "Submitting..."
                                : "Submit"}
                        </button>

                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={closeModal}
                        >
                            Close
                        </button>

                    </div>
                </form>
            </div>
        </div>
    );
}

export default ModalWindow;