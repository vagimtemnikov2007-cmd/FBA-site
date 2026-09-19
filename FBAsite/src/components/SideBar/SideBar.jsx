import React from "react";
import "./SideBar.css";
import { SORT_TYPES } from "../../service/SortAnimations";

function SideBar({ sortType, setSortType, searchQuery, setSearchQuery }) {
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
                onChange={(event) => setSearchQuery(event.target.value)}
            />

            <button onClick={changeSort}>
                Sort by: {sortLabel}
            </button>

            <button className="add-animation-button">
                + ADD YOUR ANIMATION
            </button>

        </div>
    );
}

export default SideBar;