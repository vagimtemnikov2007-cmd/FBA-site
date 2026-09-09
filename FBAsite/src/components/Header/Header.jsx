import FBALOGO from './../../assets/minecraft_title.png'
import './Header.css'
function Header() {
    return(
        <>
        <div className='Header'>
        <img src={FBALOGO} alt=""  className='logo'/>
        <nav>
            
            <a href="/install"> install </a>
            <a href="/">animations</a>
            <a href="/updates">updates</a>
        </nav>
        </div>

    
        </>
    )
} 

export default Header