const express = require('express');
const { IamAuthenticator } = require('ibm-watson/auth');
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Initialize Watson NLU
const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
  version: '2022-04-07',
  authenticator: new IamAuthenticator({
    apikey: process.env.WATSON_NLU_API_KEY,
  }),
  serviceUrl: process.env.WATSON_NLU_URL,
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required for analysis' });
    }

    if (text.length < 15) {
      return res.status(400).json({ error: 'Text must be at least 15 characters long for meaningful analysis' });
    }

    const analyzeParams = {
      text: text,
      features: {
        sentiment: {},
        emotion: {},
        keywords: {
          limit: 10
        },
        entities: {
          limit: 10
        }
      }
    };

    const analysisResults = await naturalLanguageUnderstanding.analyze(analyzeParams);
    
    // Format the response
    const formattedResults = {
      sentiment: {
        label: analysisResults.result.sentiment.document.label,
        score: analysisResults.result.sentiment.document.score
      },
      emotions: analysisResults.result.emotion.document.emotion,
      keywords: analysisResults.result.keywords || [],
      entities: analysisResults.result.entities || [],
      wordCount: text.split(' ').length
    };

    res.json(formattedResults);
    
  } catch (error) {
    console.error('Analysis error:', error);
    
    if (error.code === 'insufficient_text_content') {
      res.status(400).json({ 
        error: 'The text provided is too short or doesn\'t contain enough meaningful content for analysis.' 
      });
    } else if (error.status === 401) {
      res.status(401).json({ 
        error: 'Invalid API credentials. Please check your Watson NLU configuration.' 
      });
    } else {
      res.status(500).json({ 
        error: 'An error occurred during analysis. Please try again.' 
      });
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`News Sentiment Analyzer server running on port ${port}`);
  console.log(`Access the application at: http://localhost:${port}`);
});