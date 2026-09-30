import { useEffect, useState } from "react";
import "./ModalWindow.css";

import { submitAnimation } from "../../service/submissions";
import { addAdminAnimation, getSubmissions } from "../../service/admin.js";


function ModalWindow({
    modalType,
    setModalType,
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

        setModalType(null);

        setError("");
        setSuccess("");
    }

    const [submissions, setSubmissions] =
    useState([]);

    const [isLoadingSubmissions, setIsLoadingSubmissions] =
        useState(false);

    const [submissionsError, setSubmissionsError] =
        useState("");


    async function handleAdminAdd(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    useEffect(() => {

    if (modalType !== "submissions") {
        return;
    }


    async function loadSubmissions() {

        try {
            setIsLoadingSubmissions(true);
            setSubmissionsError("");

            const data =
                await getSubmissions();

            setSubmissions(data);

        } catch (error) {

            console.error(
                "Failed to load submissions:",
                error
            );

            setSubmissionsError(
                error.message ||
                "Failed to load submissions"
            );

        } finally {

            setIsLoadingSubmissions(false);
        }
    }


    loadSubmissions();

    }, [modalType]);

    if (!name.trim()) {
        setError("Enter animation name");
        return;
    }

    if (!author.trim()) {
        setError("Enter author name");
        return;
    }

    if (!mail.trim()) {
        setError("Enter email");
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

    try {
        setIsSubmitting(true);

        const result =
            await addAdminAnimation({
                name,
                author,
                mail,
                file,
            });

        console.log(
            "Animation published:",
            result
        );

        setSuccess(
            "Animation published successfully!"
        );

        setName("");
        setAuthor("");
        setMail("");
        setFile(null);

    } catch (error) {

        console.error(
            "Admin animation upload failed:",
            error
        );

        setError(
            error.message ||
            "Failed to publish animation"
        );

    } finally {

        setIsSubmitting(false);
    }
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



    if (!modalType) {
        return null;
    }


    return (
        <div className="modal open">

            <div className="modal-content">


                {modalType === "submit" && (
                    <>
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
                                    setName(
                                        event.target.value
                                    )
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
                                    setAuthor(
                                        event.target.value
                                    )
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
                                    setMail(
                                        event.target.value
                                    )
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
                                        event.target
                                            .files?.[0];

                                    setFile(
                                        selectedFile ||
                                        null
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
                    </>
                )}


                {/* ADMIN ADD */}

        {modalType === "admin-add" && (
            <>
                <h2>
                    Add Animation
                </h2>

                <form onSubmit={handleAdminAdd}>

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
                        placeholder="Author"
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
                        type="file"
                        accept=".json,application/json"
                        disabled={isSubmitting}
                        onChange={(event) =>
                            setFile(
                                event.target.files?.[0]
                                || null
                            )
                        }
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
                                ? "Publishing..."
                                : "Add Animation"}
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
            </>
        )}


                {/* SUBMISSIONS */}

{/* SUBMISSIONS */}

{modalType === "submissions" && (
    <>
        <h2>
            New Animations
        </h2>


        {isLoadingSubmissions && (
            <p>
                Loading submissions...
            </p>
        )}


        {submissionsError && (
            <p className="modal-error">
                {submissionsError}
            </p>
        )}


        {!isLoadingSubmissions &&
         !submissionsError &&
         submissions.length === 0 && (
            <p>
                No pending animations.
            </p>
        )}


        {!isLoadingSubmissions &&
            submissions.map(
                (submission) => (

                    <div
                        className="submission-card"
                        key={submission.id}
                    >

                        <h3>
                            {submission.name}
                        </h3>


                        <p>
                            by {submission.author}
                        </p>


                        <p>
                            {submission.mail}
                        </p>


                        <p>
                            Submitted:{" "}
                            {new Date(
                                submission.createdAt
                            ).toLocaleString()}
                        </p>


                        <div className="submission-buttons">

                            <a
                                href={
                                    submission.downloadUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                            >
                                <button
                                    type="button"
                                >
                                    Download JSON
                                </button>
                            </a>


                            <button
                                type="button"
                                onClick={() => {
                                    console.log(
                                        "Approve:",
                                        submission.id
                                    );
                                }}
                            >
                                Approve
                            </button>


                            <button
                                type="button"
                                onClick={() => {
                                    console.log(
                                        "Reject:",
                                        submission.id
                                    );
                                }}
                            >
                                Reject
                            </button>

                        </div>

                    </div>
                )
            )}


        <div className="modal-buttons">

            <button
                type="button"
                onClick={closeModal}
            >
                Close
            </button>

        </div>
    </>
)}

            </div>

        </div>
    );
}


export default ModalWindow;