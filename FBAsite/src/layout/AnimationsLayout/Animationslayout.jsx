import React from 'react';
import './Animationslayout.css';

import Header from '../../components/Header/Header';
import AnimationsPage from '../../pages/Animations';
import SideBar from '../../components/SideBar/SideBar';

function HomeLayout({ children }) {
    return (
        <>
        <Header />
        <div className="animations-layout">
            <AnimationsPage />
            <SideBar />
        </div>
        </>
    );
}

export default HomeLayout;