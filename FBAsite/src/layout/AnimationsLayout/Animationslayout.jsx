import React, { useState } from "react";
import "./Animationslayout.css";

import Header from "../../components/Header/Header";
import AnimationsPage from "../../pages/Animations";
import SideBar from "../../components/SideBar/SideBar";
import ModalWindow from "../../components/ModalWindow/ModalWindow";
import { SORT_TYPES } from "../../service/SortAnimations";

function AnimationsLayout() {
    const [sortType, setSortType] = useState(SORT_TYPES.NEWEST);
    const [searchQuery, setSearchQuery] = useState("");
    const [modalType, setModalType] = useState(null);

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
                setModalType={setModalType}
            />

            <ModalWindow
                modalType={modalType}
                setModalType={setModalType}
            />
            </div>
        </>
    );
}

export default AnimationsLayout;