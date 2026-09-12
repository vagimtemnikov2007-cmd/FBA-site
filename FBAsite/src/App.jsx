import { useState } from 'react'
import { Routes , Route} from 'react-router-dom'
import AnimationsLayout from './layout/AnimationsLayout/Animationslayout'
import HomeLayout from './layout/HomeLayout/Homelayout'
import './App.css'

function App() {
  
  return (
    <>
    <Routes>
      <Route path='/animations' element={<AnimationsLayout />}/>
      <Route path='/' element={<HomeLayout />}/>
    </Routes>
    </>
  )
}

export default App
