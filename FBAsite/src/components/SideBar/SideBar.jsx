import React from 'react'
import './SideBar.css'
function SideBar() {

    let SORT_BY = "Most Recent"
    return (
        <>
        <div className="sidebar">
            <button>Sort by: {SORT_BY}</button>
        </div>
        </>
    )
}

export default SideBar