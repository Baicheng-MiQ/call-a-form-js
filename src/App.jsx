import './App.css'
import GoogleForm from './components/GoogleForm'
import { useState } from 'react'

function App() {
  const [formId, setFormId] = useState("1oS9FDXpeXhnRzCgd_tXjyYXXFhlH5pvDS8RlgoNWkos")
  const [loadedFormId, setLoadedFormId] = useState("")
  
  const handleLoad = () => {
    setLoadedFormId(formId)
  }

  return (
    <div className="app-container">
      <div className="form-controls">
        <input 
          type="text" 
          value={formId} 
          onChange={(e) => setFormId(e.target.value)}
          placeholder="Enter Google Form ID"
        />
        <button onClick={handleLoad}>Load Form</button>
      </div>
      
      {loadedFormId && <GoogleForm formId={loadedFormId} />}
    </div>
  )
}

export default App
