import { useState, useEffect } from 'react';
import { googleConfig } from '../env';

export default function GoogleForm({ formId, onFormLoaded }) {
  const [formData, setFormData] = useState({ formId });
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    const initGoogleAuth = async () => {
      try {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.onload = resolve;
          document.body.appendChild(script);
        });

        const client = window.google?.accounts.oauth2.initTokenClient({
          client_id: googleConfig.clientId,
          scope: 'https://www.googleapis.com/auth/forms.body.readonly',
          callback: (response) => {
            setAccessToken(response.access_token);
          },
          error_callback: (err) => {
            console.error('OAuth error:', err);
            setFormData(prev => ({ ...prev, error: 'Authentication failed' }));
          },
          prompt: 'consent',
          access_type: 'offline'
        });

        client.requestAccessToken();
      } catch {
        setFormData(prev => ({ ...prev, error: 'Failed to initialize auth' }));
      }
    };

    initGoogleAuth();
  }, []);

  useEffect(() => {
    const fetchForm = async () => {
      if (!accessToken) return;

      try {
        const response = await fetch(
          `https://forms.googleapis.com/v1/forms/${formId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (!response.ok) throw new Error('Failed to fetch form');
        const data = await response.json();
        // console.log(data);
        
        // Transform the data into the requested format
        const transformedData = {
          title: data.title || data.info?.title || 'Untitled Form',
          description: data.description || data.info?.description || '',
          questions: data.items?.map(item => {
            const question = item.questionItem?.question;
            // Convert hex questionId to decimal
            const hexId = question?.questionId;
            const decimalId = hexId ? parseInt(hexId, 16) : null;
            
            return {
              id: decimalId,
              title: item.title,
              required: question?.required || false,
              type: question?.textQuestion ? 'TEXT' : 
                    question?.choiceQuestion?.type || 'UNKNOWN',
              options: question?.choiceQuestion?.options || []
            };
          }) || []
        };
        
        // Call the onFormLoaded callback with the transformed data
        if (onFormLoaded) {
          onFormLoaded(transformedData);
        }
        
        setFormData({ formId, info: data });
      } catch {
        setFormData({ formId, error: 'Failed to fetch form data' });
      }
    };

    fetchForm();
  }, [formId, accessToken, onFormLoaded]);

  if (formData.error) {
    return <div>Error: {formData.error}</div>;
  }

  if (!formData.info) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{formData.info.info?.title || 'Untitled Form'}</h1>
      <div className="text-sm mb-6">
        {formData.info.info?.description && (
          <p className="whitespace-pre-line">{formData.info.info.description}</p>
        )}
      </div>
      <div className="flex flex-col gap-6">
        {formData.info.items?.map((item) => {
          const question = item.questionItem?.question;
          const isText = !!question?.textQuestion;
          const isChoice = !!question?.choiceQuestion;
          const type = isText ? 'TEXT' : question?.choiceQuestion?.type || 'UNKNOWN';
          const options = question?.choiceQuestion?.options || [];
          const hexId = question?.questionId;
          const decimalId = hexId ? parseInt(hexId, 16) : null;
          
          return (
            <div key={item.itemId} className="border p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-medium">{item.title}</h2>
                {question?.required && <span className="text-red-500 text-sm">*Required</span>}
              </div>
              
              <div className="text-sm text-gray-500 mb-2">
                <span>ID: {decimalId} (hex: {hexId})</span>
                <span className="ml-3">Type: {type}</span>
              </div>
              
              {isChoice && (
                <div className="mt-2">
                  {type === 'RADIO' && (
                    <div className="flex flex-col gap-2">
                      {options.map((option, idx) => (
                        <div key={idx} className="flex items-center">
                          <input type="radio" disabled className="mr-2" />
                          <span>{option.isOther ? 'Other...' : option.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {type === 'CHECKBOX' && (
                    <div className="flex flex-col gap-2">
                      {options.map((option, idx) => (
                        <div key={idx} className="flex items-center">
                          <input type="checkbox" disabled className="mr-2" />
                          <span>{option.isOther ? 'Other...' : option.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {isText && (
                <div className="mt-2">
                  <input 
                    type="text" 
                    disabled 
                    placeholder="Text answer" 
                    className="w-full p-2 border rounded text-gray-400"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 