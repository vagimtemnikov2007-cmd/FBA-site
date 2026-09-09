import "./Card.css"
function Card({ name, photoUrl, link }) {
    return(
        <div className="card">
            <h2>{name}</h2>
            <video src={photoUrl} alt="" autoPlay loop />
            <button ><a href={link} target="_blank" rel="noopener noreferrer">Download</a></button>
        </div>
    )
}

export default Card