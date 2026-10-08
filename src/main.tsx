import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './components/App'
import './styles.css'
import { randomSeed, seedFromQuery } from './utils/seed'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App seed={seedFromQuery(window.location.search) ?? randomSeed()} />
  </StrictMode>,
)
