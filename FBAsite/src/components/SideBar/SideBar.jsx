import React from 'react'
import './SideBar.css'
function SideBar() {

    let SORT_BY = "Most Recent"
    
    return (
        <>
        <div className="sidebar">
            <input className="search-input" type="text" placeholder="Search..." />
            <button>Sort by: {SORT_BY}</button>
            <button className="add-animation-button">+ ADD YOUR ANIMATION</button>
        </div>
        </>
    )
}

export default SideBar