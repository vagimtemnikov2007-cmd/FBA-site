import { useEffect, useState } from "react";

import "./SideBar.css";

import { SORT_TYPES } from "../../service/SortAnimations";
import { checkAdmin } from "../../service/admin.js";


function SideBar({
    sortType,
    setSortType,
    searchQuery,
    setSearchQuery,
    setIsOpenModal,
}) {

    const [isAdmin, setIsAdmin] = useState(false);

    const [
        countSubmissionsAnimations,
        setCountSubmissionsAnimations
    ] = useState(0);


    // ---------------------------------
    // CHECK ADMIN
    // ---------------------------------

    useEffect(() => {
        async function loadAdminStatus() {
            try {
                const admin = await checkAdmin();

                setIsAdmin(admin);

            } catch (error) {
                console.error(
                    "Failed to check admin status:",
                    error
                );

                setIsAdmin(false);
            }
        }

        loadAdminStatus();
    }, []);


    // ---------------------------------
    // SORT
    // ---------------------------------

    function changeSort() {
        if (sortType === SORT_TYPES.NEWEST) {
            setSortType(SORT_TYPES.NAME);
        } else {
            setSortType(SORT_TYPES.NEWEST);
        }
    }


    const sortLabel =
        sortType === SORT_TYPES.NEWEST
            ? "Most Recent"
            : "Name";


    return (
        <div className="sidebar">

            <input
                className="search-input"
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(event) =>
                    setSearchQuery(event.target.value)
                }
            />


            <button onClick={changeSort}>
                Sort by: {sortLabel}
            </button>


            {/* PUBLIC BUTTON */}

            <button
                className="add-animation-button"
                onClick={() =>
                    setIsOpenModal(true)
                }
            >
                + ADD YOUR ANIMATION
            </button>


            {/* ADMIN BUTTONS */}

            {isAdmin && (
                <>
                    <button
                        className="add-animation-button"
                        onClick={() => {
                            console.log(
                                "Open admin add animation"
                            );
                        }}
                    >
                        + ADD ANIMATION
                    </button>


                    <button
                        className="add-animation-button"
                        onClick={() => {
                            console.log(
                                "Open submissions"
                            );
                        }}
                    >
                        New animations:{" "}
                        {countSubmissionsAnimations}
                    </button>
                </>
            )}

        </div>
    );
}


export default SideBar;