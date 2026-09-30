import { useEffect, useState } from "react";

import "./ModalWindow.css";

import {
    submitAnimation,
} from "../../service/submissions";

import {
    addAdminAnimation,
    getSubmissions,
    approveSubmission,
    rejectSubmission,
} from "../../service/admin.js";


function ModalWindow({
    modalType,
    setModalType,
}) {

    // =====================================================
    // FORM STATE
    // =====================================================

    const [name, setName] = useState("");
    const [author, setAuthor] = useState("");
    const [mail, setMail] = useState("");
    const [file, setFile] = useState(null);

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    // =====================================================
    // SUBMISSIONS STATE
    // =====================================================

    const [
        submissions,
        setSubmissions
    ] = useState([]);

    const [
        isLoadingSubmissions,
        setIsLoadingSubmissions
    ] = useState(false);

    const [
        submissionsError,
        setSubmissionsError
    ] = useState("");


    // =====================================================
    // RESET FORM
    // =====================================================

    function resetForm() {
        setName("");
        setAuthor("");
        setMail("");
        setFile(null);

        setError("");
        setSuccess("");
    }


    // =====================================================
    // CLOSE MODAL
    // =====================================================

    function closeModal() {
        if (isSubmitting) {
            return;
        }

        resetForm();

        setSubmissionsError("");

        setModalType(null);
    }


    // =====================================================
    // LOAD SUBMISSIONS
    // =====================================================

    async function loadSubmissions() {
        try {
            setIsLoadingSubmissions(true);
            setSubmissionsError("");

            console.log(
                "Loading admin submissions..."
            );

            const data =
                await getSubmissions();

            console.log(
                "Submissions received:",
                data
            );

            setSubmissions(
                Array.isArray(data)
                    ? data
                    : []
            );

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


    // =====================================================
    // LOAD SUBMISSIONS WHEN MODAL OPENS
    // =====================================================

    useEffect(() => {
        if (modalType !== "submissions") {
            return;
        }

        loadSubmissions();

    }, [modalType]);


    // =====================================================
    // CLEAR MESSAGES WHEN CHANGING MODAL
    // =====================================================

    useEffect(() => {
        setError("");
        setSuccess("");
    }, [modalType]);


    // =====================================================
    // PUBLIC SUBMISSION
    // =====================================================

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setSuccess("");


        // -------------------------
        // VALIDATION
        // -------------------------

        if (!name.trim()) {
            setError(
                "Enter animation name"
            );

            return;
        }


        if (!author.trim()) {
            setError(
                "Enter author name"
            );

            return;
        }


        if (!mail.trim()) {
            setError(
                "Enter your email"
            );

            return;
        }


        if (!file) {
            setError(
                "Select animation JSON file"
            );

            return;
        }


        if (
            !file.name
                .toLowerCase()
                .endsWith(".json")
        ) {
            setError(
                "Only .json files are allowed"
            );

            return;
        }


        if (
            file.size >
            2 * 1024 * 1024
        ) {
            setError(
                "Maximum file size is 2 MB"
            );

            return;
        }


        // -------------------------
        // SUBMIT
        // -------------------------

        try {
            setIsSubmitting(true);

            const result =
                await submitAnimation({
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


    // =====================================================
    // ADMIN ADD ANIMATION
    // =====================================================

    async function handleAdminAdd(event) {
        event.preventDefault();

        setError("");
        setSuccess("");


        // -------------------------
        // VALIDATION
        // -------------------------

        if (!name.trim()) {
            setError(
                "Enter animation name"
            );

            return;
        }


        if (!author.trim()) {
            setError(
                "Enter author name"
            );

            return;
        }


        if (!mail.trim()) {
            setError(
                "Enter email"
            );

            return;
        }


        if (!file) {
            setError(
                "Select animation JSON file"
            );

            return;
        }


        if (
            !file.name
                .toLowerCase()
                .endsWith(".json")
        ) {
            setError(
                "Only .json files are allowed"
            );

            return;
        }


        if (
            file.size >
            2 * 1024 * 1024
        ) {
            setError(
                "Maximum file size is 2 MB"
            );

            return;
        }


        // -------------------------
        // PUBLISH
        // -------------------------

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

    async function handleApprove(
    submissionId
) {
    try {
        setSubmissionsError("");

        console.log(
            "Approving submission:",
            submissionId
        );

        await approveSubmission(
            submissionId
        );

        console.log(
            "Submission approved:",
            submissionId
        );


        // Сразу убираем карточку
        // без дополнительного запроса.

        setSubmissions(
            (current) =>
                current.filter(
                    (submission) =>
                        submission.id !==
                        submissionId
                )
        );

    } catch (error) {

        console.error(
            "Approve failed:",
            error
        );

        setSubmissionsError(
            error.message ||
            "Failed to approve submission"
        );
    }
}


async function handleReject(
    submissionId
) {
    try {
        setSubmissionsError("");

        console.log(
            "Rejecting submission:",
            submissionId
        );

        await rejectSubmission(
            submissionId
        );


        console.log(
            "Submission rejected:",
            submissionId
        );


        setSubmissions(
            (current) =>
                current.filter(
                    (submission) =>
                        submission.id !==
                        submissionId
                )
        );

    } catch (error) {

        console.error(
            "Reject failed:",
            error
        );

        setSubmissionsError(
            error.message ||
            "Failed to reject submission"
        );
    }
}


    // =====================================================
    // MODAL CLOSED
    // =====================================================

    if (!modalType) {
        return null;
    }


    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="modal open">

            <div className="modal-content">


                {/* ================================================= */}
                {/* PUBLIC SUBMIT */}
                {/* ================================================= */}

                {modalType === "submit" && (
                    <>
                        <h2>
                            Submit Animation
                        </h2>


                        <form
                            onSubmit={
                                handleSubmit
                            }
                        >

                            <label>
                                Animation name
                            </label>

                            <input
                                type="text"
                                placeholder="My animation"
                                value={name}
                                disabled={
                                    isSubmitting
                                }
                                onChange={(
                                    event
                                ) =>
                                    setName(
                                        event.target
                                            .value
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
                                disabled={
                                    isSubmitting
                                }
                                onChange={(
                                    event
                                ) =>
                                    setAuthor(
                                        event.target
                                            .value
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
                                disabled={
                                    isSubmitting
                                }
                                onChange={(
                                    event
                                ) =>
                                    setMail(
                                        event.target
                                            .value
                                    )
                                }
                            />


                            <label>
                                Animation JSON
                            </label>

                            <input
                                key={
                                    file
                                        ? "file"
                                        : "empty"
                                }
                                type="file"
                                accept=".json,application/json"
                                disabled={
                                    isSubmitting
                                }
                                onChange={(
                                    event
                                ) => {
                                    setFile(
                                        event.target
                                            .files?.[0] ||
                                        null
                                    );
                                }}
                            />


                            {file && (
                                <p className="selected-file">
                                    Selected:{" "}
                                    {file.name}
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
                                    disabled={
                                        isSubmitting
                                    }
                                >
                                    {isSubmitting
                                        ? "Submitting..."
                                        : "Submit"}
                                </button>


                                <button
                                    type="button"
                                    disabled={
                                        isSubmitting
                                    }
                                    onClick={
                                        closeModal
                                    }
                                >
                                    Close
                                </button>

                            </div>

                        </form>
                    </>
                )}


                {/* ================================================= */}
                {/* ADMIN ADD */}
                {/* ================================================= */}

                {modalType === "admin-add" && (
                    <>
                        <h2>
                            Add Animation
                        </h2>


                        <form
                            onSubmit={
                                handleAdminAdd
                            }
                        >

                            <label>
                                Animation name
                            </label>

                            <input
                                type="text"
                                placeholder="My animation"
                                value={name}
                                disabled={
                                    isSubmitting
                                }
                                onChange={(
                                    event
                                ) =>
                                    setName(
                                        event.target
                                            .value
                                    )
                                }
                            />


                            <label>
                                Author
                            </label>

                            <input
                                type="text"
                                placeholder="Author"
                                value={author}
                                disabled={
                                    isSubmitting
                                }
                                onChange={(
                                    event
                                ) =>
                                    setAuthor(
                                        event.target
                                            .value
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
                                disabled={
                                    isSubmitting
                                }
                                onChange={(
                                    event
                                ) =>
                                    setMail(
                                        event.target
                                            .value
                                    )
                                }
                            />


                            <label>
                                Animation JSON
                            </label>

                            <input
                                key={
                                    file
                                        ? "admin-file"
                                        : "admin-empty"
                                }
                                type="file"
                                accept=".json,application/json"
                                disabled={
                                    isSubmitting
                                }
                                onChange={(
                                    event
                                ) =>
                                    setFile(
                                        event.target
                                            .files?.[0] ||
                                        null
                                    )
                                }
                            />


                            {file && (
                                <p className="selected-file">
                                    Selected:{" "}
                                    {file.name}
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
                                    disabled={
                                        isSubmitting
                                    }
                                >
                                    {isSubmitting
                                        ? "Publishing..."
                                        : "Add Animation"}
                                </button>


                                <button
                                    type="button"
                                    disabled={
                                        isSubmitting
                                    }
                                    onClick={
                                        closeModal
                                    }
                                >
                                    Close
                                </button>

                            </div>

                        </form>
                    </>
                )}


                {/* ================================================= */}
                {/* SUBMISSIONS */}
                {/* ================================================= */}

                {modalType === "submissions" && (
                    <>
                        <h2>
                            New Animations
                        </h2>


                        <div className="modal-buttons">

                            <button
                                type="button"
                                disabled={
                                    isLoadingSubmissions
                                }
                                onClick={
                                    loadSubmissions
                                }
                            >
                                {isLoadingSubmissions
                                    ? "Refreshing..."
                                    : "Refresh"}
                            </button>

                        </div>


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
                                (
                                    submission
                                ) => (

                                    <div
                                        className="submission-card"
                                        key={
                                            submission.id
                                        }
                                    >

                                        <h3>
                                            {
                                                submission.name
                                            }
                                        </h3>


                                        <p>
                                            by{" "}
                                            {
                                                submission.author
                                            }
                                        </p>


                                        <p>
                                            {
                                                submission.mail
                                            }
                                        </p>


                                        {submission.createdAt && (
                                            <p>
                                                Submitted:{" "}
                                                {new Date(
                                                    submission.createdAt
                                                ).toLocaleString()}
                                            </p>
                                        )}


                                        <div className="submission-buttons">

                                            {submission.downloadUrl && (
                                                <a
                                                    href={
                                                        submission.downloadUrl
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="dow-json"
                                                >
                                                    Download JSON
                                                </a>
                                            )}


                                            <button
                                            type="button"
                                            onClick={() =>
                                                handleApprove(
                                                    submission.id
                                                )
                                            }
                                        >
                                            Approve
                                        </button>


                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleReject(
                                                        submission.id
                                                    )
                                                }
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
                                onClick={
                                    closeModal
                                }
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