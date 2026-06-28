import './App.css'
import Header from './components/Header'
import Tabs from './components/Tabs'
import { AudioProvider } from './context/AudioContext'

function App() {
  return (
    <AudioProvider>
      <Header />
      <section id="bass">
        <Tabs />
      </section>
    </AudioProvider>
  )
}

export default App
