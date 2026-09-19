import React, { useState } from "react";
import "./Animationslayout.css";

import Header from "../../components/Header/Header";
import AnimationsPage from "../../pages/Animations";
import SideBar from "../../components/SideBar/SideBar";
import Modal from "../../components/ModalWindow/ModalWindow"
import { SORT_TYPES } from "../../service/SortAnimations";

function AnimationsLayout() {
    const [sortType, setSortType] = useState(SORT_TYPES.NEWEST);
    const [searchQuery, setSearchQuery] = useState("");
    const [isOpenModal, setIsOpenModal] = useState(false);

    return (
        <>
            <Header />

            <div className="animations-layout">
                <AnimationsPage sortType={sortType} searchQuery={searchQuery} />

                <Modal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} />

                <SideBar
                    sortType={sortType}
                    setSortType={setSortType}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    isOpenModal= {isOpenModal}
                    setIsOpenModal= {setIsOpenModal}
                />
            </div>
        </>
    );
}

export default AnimationsLayout;