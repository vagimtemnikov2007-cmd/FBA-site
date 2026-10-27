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


            <label className="sort-control">
                <span>Sort by</span>
                <select value={sortType} onChange={event => setSortType(event.target.value)}>
                    <option value={SORT_TYPES.POPULAR}>Most Popular</option>
                    <option value={SORT_TYPES.NEWEST}>Most Recent</option>
                    <option value={SORT_TYPES.NAME}>Name</option>
                </select>
            </label>


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
                        New animations
                    </button>
                </>
            )}

        </div>
    );
}


export default SideBar;
