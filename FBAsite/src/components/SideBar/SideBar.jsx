import { useEffect, useState } from "react";

import "./SideBar.css";

import { SORT_TYPES } from "../../service/SortAnimations";
import { checkAdmin } from "../../service/admin.js";


function SideBar({
    sortType,
    setSortType,
    searchQuery,
    setSearchQuery,
    setModalType,
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
                onClick={() => setModalType("submit")}
            >
                + ADD YOUR ANIMATION
            </button>


            {isAdmin && (
                <>
                    <button
                        className="add-animation-button"
                        onClick={() => setModalType("admin-add")}
                    >
                        + ADD ANIMATION
                    </button>

                    <button
                        className="add-animation-button"
                        onClick={() => setModalType("submissions")}
                    >
                        New animations: {countSubmissionsAnimations}
                    </button>
                </>
            )}

        </div>
    );
}


export default SideBar;