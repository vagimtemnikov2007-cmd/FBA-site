import Card from "../components/Card/Card";
import {animations} from "../assets/animations/index.js";
import "./Animations.css"
function AnimationsPage() {
    return(
        <>
        <div className="animations-container">
            <Card name="Anvil Stamp" photoUrl={animations.AnvilStamp} link={"https://drive.google.com/file/d/1tp4CGa8NoZPbkv5AcB9w2scg-vs8zOrd/view?usp=drive_link"} />
            <Card name="Bloom Burst" photoUrl={animations.BloomBurst} link={"https://drive.google.com/file/d/1-XWpV6LjTjZLEvMPcG8VqBcN8V0BYbX_/view?usp=sharing"} />
            <Card name="Jelly Recoil" photoUrl={animations.JellyRecoil} link={"https://drive.google.com/file/d/1VfjtDc-OU6gJpQBAdUCQT_BUeY-s1ggH/view?usp=sharing"} />
            <Card name="Magnetic Slingshot" photoUrl={animations.MagneticSlingshot} link={"https://drive.google.com/file/d/1gsx5w6mAunrKZsaqTIAcpZ5o7dpZ8HNf/view?usp=sharing"} />
            <Card name="Orbit Lock" photoUrl={animations.OrbitLock} link={"https://drive.google.com/file/d/15SU0kVvm7BM6mtrDbPTCH2saNY_Oe0rM/view?usp=sharing"} />
            <Card name="Paper Snap" photoUrl={animations.PaperSnap} link={"https://drive.google.com/file/d/1aOxWYqJW669sT8Wammaijgxb9sbondQb/view?usp=sharing"} />
            <Card name="Phase Flicker" photoUrl={animations.PhaseFlicker} link={"https://drive.google.com/file/d/1e7QQTjeifmnvTue8x_3etmTQIa3c9G47/view?usp=sharing"} />
            <Card name="Sidewinder" photoUrl={animations.Sidewinder} link={"https://drive.google.com/file/d/1JzP8OdU0gobg86-JvKQOc1nPQrwPH48V/view?usp=sharing"} />
        </div>
        </>
    )
}

export default AnimationsPage