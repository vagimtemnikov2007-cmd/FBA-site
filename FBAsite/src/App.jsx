import { useEffect } from 'react'
import { Routes , Route} from 'react-router-dom'
import AnimationsLayout from './layout/AnimationsLayout/Animationslayout'
import HomeLayout from './layout/HomeLayout/Homelayout'
import HelpLayout from './layout/Help/HelpLayout'
import { trackVisitor } from './service/api'
import './App.css'


let temporaryVisitorID;
function getVisitorID() {
    let id;
    try { id = localStorage.getItem('visitorID'); } catch { /* Storage can be disabled. */ }
    if (!id) {
      id = temporaryVisitorID ??= crypto.randomUUID();
      try { localStorage.setItem('visitorID', id); } catch { /* Keep the current session working. */ }
    }
    return id;
    
    
}

function App() {

useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    let lastVisitDate;
    try { lastVisitDate = localStorage.getItem("lastVisitDate"); } catch { /* Optional persistence. */ }

    if (lastVisitDate === today) {
        return;
    }

    const visitorId = getVisitorID();

    trackVisitor(visitorId)
        .then(data => {
            console.log("Visitor tracked:", data);

            try { localStorage.setItem("lastVisitDate", today); } catch { /* Optional persistence. */ }
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
      <Route path='/Help' element={<HelpLayout />}/>
    </Routes>
    </>
  )
}

getVisitorID()
export default App
