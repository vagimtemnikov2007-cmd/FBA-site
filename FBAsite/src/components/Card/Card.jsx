import "./Card.css"
function Card({  name,
  author,
  previewUrl,
  downloadUrl,
  created_at
}) {
    return(
        <div className="card">
            <h2>{name}</h2>
            <p>by {author}</p>
            <p>
  publish: {new Date(created_at).toLocaleDateString("en-US")}
</p>
            <video src={previewUrl} alt="" autoPlay loop />
            <button ><a href={downloadUrl} target="_blank" rel="noopener noreferrer">Download</a></button>
        </div>
    )
}

export default Card