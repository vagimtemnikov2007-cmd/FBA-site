import { useEffect } from 'react'
import { Routes , Route} from 'react-router-dom'
import AnimationsLayout from './layout/AnimationsLayout/Animationslayout'
import HomeLayout from './layout/HomeLayout/Homelayout'
import { trackVisitor } from './service/api'
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
    const today = new Date().toISOString().slice(0, 10);
    const lastVisitDate = localStorage.getItem("lastVisitDate");

    if (lastVisitDate === today) {
        return;
    }

    const visitorId = getVisitorID();

    trackVisitor(visitorId)
        .then(data => {
            console.log("Visitor tracked:", data);

            localStorage.setItem("lastVisitDate", today);
        })
        .catch(error => {
            console.error(
                "Failed to track visitor after retries:",
                error
            );
        });

}, []);

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
