import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

const GITHUB_URL = 'https://github.com/phalelashvili/naecresults'

function GithubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" />
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z" />
    </svg>
  )
}

// White by default; toggles data-theme on <html> and remembers the choice.
function ThemeToggle() {
  const [dark, setDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark',
  )
  useEffect(() => {
    const root = document.documentElement
    if (dark) root.dataset.theme = 'dark'
    else delete root.dataset.theme
    try { localStorage.setItem('theme', dark ? 'dark' : 'light') } catch {}
  }, [dark])
  return (
    <button
      type="button"
      className="nav-theme"
      onClick={() => setDark((d) => !d)}
      title={dark ? 'ნათელ თემაზე გადართვა' : 'მუქ თემაზე გადართვა'}
      aria-label="თემის გადართვა"
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

// Single, stable top navigation shared by both tabs — its contents never change
// when you switch tabs. Tab-specific controls live inside each page, not here.
export default function Header() {
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <NavLink to="/tests" className="brand">
          <span className="brand-mark">π</span>
          <span className="brand-text">
            ეროვნული გამოცდები
            <small>ტესტები &amp; ჩარიცხვები</small>
          </span>
        </NavLink>
        <nav className="main-nav">
          <NavLink to="/tests" className={({ isActive }) => (isActive ? 'active' : '')}>
            ტესტები
          </NavLink>
          <NavLink to="/theory" className={({ isActive }) => (isActive ? 'active' : '')}>
            თეორია
          </NavLink>
          <NavLink to="/results" className={({ isActive }) => (isActive ? 'active' : '')}>
            ჩარიცხვები
          </NavLink>
          <a className="nav-gh" href={GITHUB_URL} target="_blank" rel="noopener noreferrer" title="GitHub" aria-label="GitHub">
            <GithubIcon />
          </a>
          <ThemeToggle />
        </nav>
      </div>
      <div className="site-disclaimer">
        <span className="disc-full">
          ⚠️ არაოფიციალური, ექსპერიმენტული საიტი — მონაცემები შესაძლოა შეიცავდეს უზუსტობებს;
          გადაამოწმეთ ოფიციალურ წყაროებთან.
        </span>
        <span className="disc-short">⚠️ არაოფიციალური, ექსპერიმენტული საიტი</span>
      </div>
    </header>
  )
}
