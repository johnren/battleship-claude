import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './components/App'
import './styles.css'
import { randomSeed, seedFromQuery } from './utils/seed'

// ?seed=123 makes the computer's fleet and shots repeatable, including after Play Again.
const fixedSeed = seedFromQuery(window.location.search)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App seed={fixedSeed ?? randomSeed()} fixedSeed={fixedSeed} />
  </StrictMode>,
)
