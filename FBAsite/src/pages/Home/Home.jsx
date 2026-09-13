import React from 'react';
import './Home.css';

import FBALOGO from '../../assets/FBA-LOGO.png';

function Home() {
    return (
        <div className="home">
            <img className="home-image" src={FBALOGO} alt="Fresh Block Animations" />
            <h1>Make your blocks come alive!</h1>

            <div className="button-container">
            <button className="home-button INSTALL" onClick={() => window.location.href = 'https://modrinth.com/mod/fresh-block-animations'}>Install Mod</button>
            <button className="home-button ANIMATIONS" onClick={() => window.location.href = '/animations'}>View Animations</button>
            <button className="home-button YOUTUBE" onClick={() => window.location.href = 'https://www.youtube.com/@%D0%B1%D0%B0%D1%81%D0%B8%D0%BB11'}>Youtube</button>
            <button className="home-button DISCORD" onClick={() => window.location.href = 'https://discord.gg/FGdjkw6RDA'}>Discord</button>
            </div>
            <p>Fresh Block Animations is a Minecraft mod that adds new animations to blocks in the game. It is designed to enhance the visual experience of Minecraft by making blocks feel more alive and interactive.</p>
            <p>To get started, you can install the mod from <a className="home-link" href="https://modrinth.com/mod/fresh-block-animations">Modrinth</a>. Once installed, you can explore the various animations available in the mod and see how they enhance your Minecraft experience.</p>
            <p>Feel free to check out the animations page to see all the animations included in the mod, and don't forget to check for updates regularly!</p>
        </div>
    );


}
export default Home;
