import './App.css'
import Header from './components/Header'
import Tabs from './components/Tabs'
import LoginModal from './components/LoginModal/LoginModal'
import { AudioProvider } from './context/AudioContext'
import { useAuth } from './context/AuthContext'

function AppInner() {
  const { showLoginModal } = useAuth()
  return (
    <AudioProvider>
      <Header />
      <section id="bass">
        <Tabs />
      </section>
      {showLoginModal && <LoginModal />}
    </AudioProvider>
  )
}

export default function App() {
  return <AppInner />
}
