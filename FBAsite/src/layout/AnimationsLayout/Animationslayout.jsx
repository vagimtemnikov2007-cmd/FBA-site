import React, { useState } from "react";
import "./Animationslayout.css";

import Header from "../../components/Header/Header";
import AnimationsPage from "../../pages/Animations";
import SideBar from "../../components/SideBar/SideBar";
import { SORT_TYPES } from "../../service/SortAnimations";

function AnimationsLayout() {
    const [sortType, setSortType] = useState(SORT_TYPES.NEWEST);
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <>
            <Header />

            <div className="animations-layout">
                <AnimationsPage sortType={sortType} searchQuery={searchQuery} />

                <SideBar
                    sortType={sortType}
                    setSortType={setSortType}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
            </div>
        </>
    );
}

export default AnimationsLayout;