import { Routes, Route } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { Band } from '@/pages/Band'
import { Audience } from '@/pages/Audience'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/band" element={<Band />} />
      <Route path="/audience" element={<Audience />} />
    </Routes>
  )
}

export default App
