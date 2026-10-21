import './HelpCard.css' 
function HelpCard({ question, answer }) {
    return (
        <div className="HelpCard">
            <h2 className="HelpCard-question">{question}</h2>

            <div className="HelpCard-answer">
                {answer}
            </div>
        </div>
    )
}

export default HelpCard