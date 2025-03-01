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
            return {
              id: question?.questionId,
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
    <div>
      <h1 className="text-2xl font-bold">{formData.info.info?.title || 'Untitled Form'}</h1>
      <div className="text-sm">
        {formData.info.info?.description && (
          <p>{formData.info.info.description}</p>
        )}
      </div>
      <div className="flex flex-col gap-4">
        {formData.info.items?.map((item) => (
          <div key={item.id}>
            <h2>{item.title}</h2>
          </div>
        ))}
      </div>
    </div>
  );
} 