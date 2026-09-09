import Card from "../components/Card/Card";
import {animations} from "../assets/animations/index.js";
import "./Animations.css"
function AnimationsPage() {
    return(
        <>
        <div className="animations-container">
            <Card name="Anvil Stamp" photoUrl={animations.AnvilStamp} link={"https://drive.google.com/file/d/1tp4CGa8NoZPbkv5AcB9w2scg-vs8zOrd/view?usp=drive_link"} />
            <Card name="Bloom burst" photoUrl={animations.AnvilStamp} link={"https://drive.google.com/file/d/1tp4CGa8NoZPbkv5AcB9w2scg-vs8zOrd/view?usp=drive_link"} />
            <Card name="Jelly recoil" photoUrl={animations.AnvilStamp} link={"https://drive.google.com/file/d/1tp4CGa8NoZPbkv5AcB9w2scg-vs8zOrd/view?usp=drive_link"} />
            <Card name="Magnetic slingshot" photoUrl={animations.AnvilStamp} link={"https://drive.google.com/file/d/1tp4CGa8NoZPbkv5AcB9w2scg-vs8zOrd/view?usp=drive_link"} />
            <Card name="orbit lock" photoUrl={animations.AnvilStamp} link={"https://drive.google.com/file/d/1tp4CGa8NoZPbkv5AcB9w2scg-vs8zOrd/view?usp=drive_link"} />
            <Card name="Paper snap" photoUrl={animations.AnvilStamp} link={"https://drive.google.com/file/d/1tp4CGa8NoZPbkv5AcB9w2scg-vs8zOrd/view?usp=drive_link"} />
            <Card name="phase flicker" photoUrl={animations.AnvilStamp} link={"https://drive.google.com/file/d/1tp4CGa8NoZPbkv5AcB9w2scg-vs8zOrd/view?usp=drive_link"} />
            <Card name="sidewinder" photoUrl={animations.AnvilStamp} link={"https://drive.google.com/file/d/1tp4CGa8NoZPbkv5AcB9w2scg-vs8zOrd/view?usp=drive_link"} />
        </div>
        </>
    )
}

export default AnimationsPage