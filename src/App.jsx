import './App.css'
import GoogleForm from './components/GoogleForm'
import { useState, useRef } from 'react'
import { openaiConfig } from './env'
import { Card, CardContent } from './components/ui/Card'
import { Button } from './components/ui/Button'
import { Input } from './components/ui/Input'
import { Textarea } from './components/ui/Textarea'
import { motion } from 'framer-motion'

function App() {
  const [instructions, setInstructions] = useState("You help users with Google Forms. Ask questions one by one to guide them and use functions to fill answers. End the conversation if it goes off-topic or the user is unresponsive. Speak with a natural and warm voice, like a real human surveyor. Start by saying hello, and introduce yourself and the form. Ask user to confirm continue and tell them this call may be monitored or recorded. You only provide answers by function call by the end of the conversation. If conversation ends without sufficient information, don't call any functions.")
  const [formId, setFormId] = useState("")
  const [loadedFormId, setLoadedFormId] = useState("")
  const [openAISchema, setOpenAISchema] = useState(null)
  const textareaRef = useRef(null)

  const handleLoad = () => {
    if (formId.trim()) {
      setLoadedFormId(formId.trim())
    } else {
      alert("Please enter a valid Google Form ID")
    }
  }

  const handleFormLoaded = (transformedData, schema) => {
    setOpenAISchema(schema)
  }

  const copyOpenAISetup = () => {
    if (!openAISchema) return
    const setup = `${JSON.stringify(openAISchema, null, 2)}`
    navigator.clipboard.writeText(setup)
    alert('OpenAI setup code copied to clipboard!')
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <Card className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-2xl">
          <h1 className="text-4xl font-bold mb-4">Google Form OpenAI Integration</h1>
          <p className="text-lg">Seamlessly integrate OpenAI with Google Forms to automate form filling and enhance productivity.</p>
        </Card>
      </motion.div>

      <Card className="p-6 bg-white shadow-md">
        <CardContent className="space-y-4">
          <label className="block text-lg font-semibold text-gray-700">System Instructions for OpenAI</label>
          <Textarea
            ref={textareaRef}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Enter instructions for the AI"
            rows={6}
          />

          <label className="block text-lg font-semibold text-gray-700">Google Form ID</label>
          <div className="flex gap-4">
            <Input
              value={formId}
              onChange={(e) => setFormId(e.target.value)}
              placeholder="Enter Google Form ID"
            />
            <Button onClick={handleLoad} className="bg-blue-600 hover:bg-blue-700">
              Load Form
            </Button>
          </div>
        </CardContent>
      </Card>

      {loadedFormId && (
        <Card className="p-6 bg-blue-50 shadow-md">
          <h2 className="text-lg font-semibold mb-2">Loading Form: {loadedFormId}</h2>
          <GoogleForm formId={loadedFormId} onFormLoaded={handleFormLoaded} />
        </Card>
      )}

      {openAISchema && (
        <Card className="p-6 bg-green-50 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">OpenAI Schema Generated</h2>
            <Button onClick={copyOpenAISetup} className="bg-green-600 hover:bg-green-700">
              Copy OpenAI Setup Code
            </Button>
          </div>
          <div className="bg-white p-3 rounded-md shadow-sm overflow-auto max-h-60">
            <pre className="text-xs">
              {JSON.stringify(openAISchema, null, 2)}
            </pre>
          </div>
        </Card>
      )}
    </div>
  )
}

export default App
