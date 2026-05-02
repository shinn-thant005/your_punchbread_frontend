import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import RootRoutes from './RootRoutes.jsx' // Import the logic you built

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 
      RootRoutes already contains a <BrowserRouter>, 
      so we don't need to add one here.
    */}
    <RootRoutes />
  </StrictMode>,
)