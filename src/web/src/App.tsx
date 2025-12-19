import { Routes, Route } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { Band } from '@/pages/Band'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/band" element={<Band />} />
    </Routes>
  )
}

export default App
