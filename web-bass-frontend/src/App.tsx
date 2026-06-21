import './App.css'
import Tabs from './components/Tabs'
import { AudioProvider } from './context/AudioContext'

function App() {
  return (
    <AudioProvider>
      <section id="title">
        <h1>Web Bass</h1>
      </section>
      <section id="bass">
        <Tabs />
      </section>
    </AudioProvider>
  )
}

export default App
