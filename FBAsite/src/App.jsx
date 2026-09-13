import { useEffect } from 'react'
import { Routes , Route} from 'react-router-dom'
import AnimationsLayout from './layout/AnimationsLayout/Animationslayout'
import HomeLayout from './layout/HomeLayout/Homelayout'
import './App.css'


function getVisitorID() {
    let id = localStorage.getItem('visitorID');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('visitorID', id);
    }
    return id;
    
}

function App() {

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const lastVisitDate = localStorage.getItem('lastVisitDate')

    if (!lastVisitDate || lastVisitDate !== today) {
      const visitorId = getVisitorID()

      fetch('https://fba-server.onrender.com/visitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visitorId }),
      })
        .then(response => response.json())
        .then(data => {
          console.log('Visitor ID sent to server:', data)

          localStorage.setItem('lastVisitDate', today)
        })
        .catch(error => {
          console.error('Error sending visitor ID to server:', error)
        })
    }
  }, [])

  return (
    <>
    <Routes>
      <Route path='/animations' element={<AnimationsLayout />}/>
      <Route path='/' element={<HomeLayout />}/>
    </Routes>
    </>
  )
}

getVisitorID()
export default App
