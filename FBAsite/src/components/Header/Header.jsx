import { NavLink } from 'react-router-dom'
import FBALOGO from './../../assets/minecraft_title.png'
import './Header.css'

function Header() {
    return(
        <>
        <div className='Header'>
        <img src={FBALOGO} alt=""  className='logo'/>
        <nav>
            <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Home</NavLink>
            <a href="https://modrinth.com/mod/fresh-block-animations"> install </a>
            <NavLink to="/animations" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>animations</NavLink>
            {/* <a href="/updates">updates</a> */}  
        </nav>
        </div>

    
        </>
    )
} 

export default Header