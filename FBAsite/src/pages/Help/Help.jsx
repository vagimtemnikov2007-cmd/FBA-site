import HelpCard from '../../components/HelpCard/HelpCard'
function Help() {
    return(
        <>
        <div className='Help'>
            <HelpCard question="How do I download and install Fresh Block Animations?" answer="Download the mod version that matches your Minecraft version and mod loader. Place the downloaded .jar file in your Minecraft instance’s mods folder, then launch the game. Install any dependencies listed on the download page." />
            <HelpCard question="How do I open the mod settings and make animations smoother?" answer="On versions before 26.3, open the settings through Mod Menu. On 26.3 and newer, you can also access them through the regular game settings. To make animations slower, increase Duration in the Animations tab. You can also adjust Hard Mode in the Main tab to change how frequently animations update." />
            <HelpCard question="How do I install custom animations from the website?" answer="Download an animation’s .json file, open your Minecraft instance folder, and place it here: config/fresh-blocks-animations/animations" />
            <HelpCard question="How do I create my own animation?" answer="Start with an existing animation .json file as a template. Make a copy, open it in a text editor, and adjust its animation settings while keeping the JSON structure valid. Save your file in config/fresh-blocks-animations/animations, then test it in the game." />
        </div>
        </>
    )
}

export default Help