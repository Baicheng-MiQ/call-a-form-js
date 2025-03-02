import './App.css'
import GoogleForm from './components/GoogleForm'
import { useState, useRef } from 'react'
import { Card, CardContent } from './components/ui/Card'
import { Button } from './components/ui/Button'
import { Input } from './components/ui/Input'
import { Textarea } from './components/ui/Textarea'
import { motion } from 'framer-motion'
import { ClipboardCopy, Phone, Upload, FileCheck } from 'lucide-react'

function App() {
  const [instructions, setInstructions] = useState("You help user with Forms. Ask questions one by one to guide them and use functions to fill answers. End the conversation if it goes off-topic or the user is unresponsive. Speak with a natural and warm voice, like a real human surveyor. Start by saying hello, and introduce yourself and the form. Ask user to confirm continue and tell them this call may be monitored or recorded. You only provide answers by function call by the end of the conversation. If conversation ends without sufficient information, don't call any functions.")
  const [formId, setFormId] = useState("")
  const [loadedFormId, setLoadedFormId] = useState("")
  const [openAISchema, setOpenAISchema] = useState(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const textareaRef = useRef(null)

  const handleLoad = () => {
    if (formId.trim()) {
      setLoadedFormId(formId.trim())
    } else {
      alert("Please enter a valid Google Form ID")
    }
  }

  const handleFormLoaded = (transformedData, schema) => {
    // console.log("transformedData", transformedData)
    setOpenAISchema(schema)
  }

  const copyOpenAISetup = () => {
    if (!openAISchema) return
    const setup = `${JSON.stringify(openAISchema, null, 2)}`
    navigator.clipboard.writeText(setup)
    alert('OpenAI setup code copied to clipboard!')
  }

  const handleDial = () => {
    const url = `http://35.246.71.74:9999/dial/${phoneNumber}`
    fetch(url, {
      method: 'POST',
    })
      .then(response => response.json())
      .then(data => console.log(data))
      .catch(error => console.error('Error:', error))
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8  space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }}
        >
          <Card className="overflow-hidden shadow-xl rounded-xl border-0 p-0">
            <div className="p-8 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <h1 className="text-4xl font-bold mb-3">TalkToForm</h1>
              <p className="text-lg opacity-90">Build your own AI agent, Zero code needed.</p>
            </div>
          </Card>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-8"
          >
            <Card className="shadow-md rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    <FileCheck size={18} />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-800">System Instructions</h2>
                </div>
                <Textarea
                  ref={textareaRef}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Enter instructions for the AI"
                  rows={8}
                  className="border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </CardContent>
            </Card>

            <Card className="shadow-md rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    <Upload size={18} />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-800">Google Form ID</h2>
                </div>
                <div className="flex gap-3">
                  <Input
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="Enter Google Form ID"
                    className="border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <Button onClick={handleLoad} className="bg-indigo-600 hover:bg-indigo-700 transition-colors">
                    Load
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-md rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    <Phone size={18} />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-800">Phone Number</h2>
                </div>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                  className="border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-3"
                />
                <Button onClick={handleDial} className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors">
                  Dial Number
                </Button>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-8"
          >
            {loadedFormId && (
              <Card className="shadow-md rounded-xl border border-blue-200 bg-blue-50 hover:shadow-lg transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="px-3 py-1 bg-blue-200 text-blue-800 text-sm font-medium rounded-full">
                      Active Form
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-inner">
                    <GoogleForm formId={loadedFormId} onFormLoaded={handleFormLoaded} />
                  </div>
                </CardContent>
              </Card>
            )}

            {openAISchema && (
              <Card className="shadow-md rounded-xl border border-green-200 bg-green-50 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-green-200 text-green-800 text-sm font-medium rounded-full">
                        Schema Ready
                      </div>
                    </div>
                    <Button 
                      onClick={copyOpenAISetup} 
                      className="bg-green-600 hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <ClipboardCopy size={16} />
                      <span>Copy</span>
                    </Button>
                  </div>
                  <div className="bg-white p-4 rounded-md shadow-inner overflow-auto max-h-80">
                    <pre className="text-xs text-slate-800">
                      {JSON.stringify(openAISchema, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {!loadedFormId && !openAISchema && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-xl shadow-md border border-slate-200">
                  <div className="inline-flex h-16 w-16 rounded-full bg-indigo-100 items-center justify-center mb-4">
                    <Upload size={28} className="text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-medium text-slate-800 mb-2">No Form Loaded</h3>
                  <p className="text-slate-500 mb-4">Enter a Google Form ID and click "Load" to get started</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-sm text-slate-500 mt-12"
        >
          <p>© 2023 Google Form + OpenAI Integration • All rights reserved</p>
        </motion.div>
      </div>
    </div>
  )
}

export default App
