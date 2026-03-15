
import './App.css'
import Button from './components/ui/Button'
import Card from './components/ui/Card'
import Input from './components/ui/Input'

function App() {


  return (
    <>
      <Card
        title="card"
        style={{ border: "1px solid red", maxWidth: "200px" }}
      >
        <Input
          label="ooga"
          placeholder="booga"
        />
        <Button
        >Start Workout</Button>
      </Card>
    </>


  )
}

export default App
