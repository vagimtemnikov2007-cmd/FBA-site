import React from 'react';
import './Homelayout.css';

import Header from '../../components/Header/Header';
import HomePage from '../../pages/Home/Home';

function HomeLayout() {
    return (
        <>
        <Header />
        <div className="home-layout">
            <HomePage />
        </div>
        </>
    );
}

export default HomeLayout;