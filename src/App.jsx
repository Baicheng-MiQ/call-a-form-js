import './App.css'
import GoogleForm from './components/GoogleForm'
import { useState, useRef } from 'react'

function App() {
  const [instructions, setInstructions] = useState("You help users with Google Forms. Ask questions one by one to guide them and use functions to fill answers. End the conversation if it goes off-topic or the user is unresponsive. Speak with a natural and warm voice, like a real human surveyor. Start by asying hello, and introduce yourself and the form. Ask user to confirm continue and tell them this call may be monitored or recorded. You only provide answers by function call by the end of the conversation. If conversation ends without sufficient information, don't call any functions.")
  const [formId, setFormId] = useState("")
  const [loadedFormId, setLoadedFormId] = useState("")
  const textareaRef = useRef(null)
  
  const handleLoad = () => {
    setLoadedFormId(formId)
  }

  return (
    <div className="flex flex-col gap-4 bg-gray-100 p-4 rounded-md">
      <h1 className="text-2xl font-bold">Google Form Caller</h1>
      <div className="form-controls flex flex-col gap-4 bg-gray-100 p-4 rounded-md">
        <textarea
          ref={textareaRef}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Enter instructions"
          className="border-2 border-gray-300 rounded-md p-2"
          rows={10}
        />
        <input 
          type="text" 
          value={formId} 
          onChange={(e) => setFormId(e.target.value)}
          placeholder="Enter Google Form ID"
        />
        <button onClick={handleLoad}>Load Form</button>
      </div>
      
      {loadedFormId && <GoogleForm formId={loadedFormId} onFormLoaded={(form)=>console.log(form)} />}
    </div>
  )
}

export default App
