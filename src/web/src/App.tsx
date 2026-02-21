import { Routes, Route } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { Band } from '@/pages/Band'
import { Audience } from '@/pages/Audience'
import { DebugLogPanel } from '@/components/DebugLogPanel'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/band" element={<Band />} />
        <Route path="/audience" element={<Audience />} />
      </Routes>
      <DebugLogPanel />
    </>
  )
}

export default App
