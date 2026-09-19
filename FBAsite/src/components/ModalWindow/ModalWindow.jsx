import './ModalWindow.css'
function ModalWindow({isOpenModal , setIsOpenModal}) {
    return (
        <>
        <div className={`modal ${isOpenModal ? "open" : "closed"}`}>
            <p> Sorry. This feature isn`t available yet </p>
            <button onClick={() => setIsOpenModal(false)}>close</button>      
        </div>

        </>
    )
}

export default ModalWindow