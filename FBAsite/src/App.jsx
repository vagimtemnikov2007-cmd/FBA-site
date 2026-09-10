import { useState } from 'react'
import { Routes , Route} from 'react-router-dom'
import HomeLayout from './layout/HomeLayout/Homelayout'
import './App.css'

function App() {
  
  return (
    <>
    <Routes>
      <Route path='/' element={<HomeLayout />}/>
    </Routes>
    </>
  )
}

export default App
