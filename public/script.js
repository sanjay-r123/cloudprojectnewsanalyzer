document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const newsText = document.getElementById('newsText');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const charCount = document.getElementById('charCount');
    const loadingSection = document.getElementById('loadingSection');
    const resultsSection = document.getElementById('resultsSection');
    const errorSection = document.getElementById('errorSection');

    // Event Listeners
    newsText.addEventListener('input', updateCharacterCount);
    analyzeBtn.addEventListener('click', analyzeText);
    clearBtn.addEventListener('click', clearText);

    // Update character count
    function updateCharacterCount() {
        const count = newsText.value.length;
        charCount.textContent = count;
        
        // Enable/disable analyze button based on content
        analyzeBtn.disabled = count < 15;
    }

    // Clear text and results
    function clearText() {
        newsText.value = '';
        updateCharacterCount();
        hideAllSections();
    }

    // Hide all result sections
    function hideAllSections() {
        loadingSection.style.display = 'none';
        resultsSection.style.display = 'none';
        errorSection.style.display = 'none';
    }

    // Show loading state
    function showLoading() {
        hideAllSections();
        loadingSection.style.display = 'block';
        analyzeBtn.disabled = true;
    }

    // Hide loading state
    function hideLoading() {
        loadingSection.style.display = 'none';
        analyzeBtn.disabled = false;
    }

    // Show error
    function showError(message) {
        hideAllSections();
        document.getElementById('errorMessage').textContent = message;
        errorSection.style.display = 'block';
    }

    // Analyze text function
    async function analyzeText() {
        const text = newsText.value.trim();
        
        if (!text) {
            showError('Please enter some text to analyze.');
            return;
        }

        if (text.length < 15) {
            showError('Please enter at least 15 characters for meaningful analysis.');
            return;
        }

        showLoading();

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Analysis failed');
            }

            displayResults(data);
            
        } catch (error) {
            console.error('Analysis error:', error);
            showError(error.message || 'An error occurred during analysis. Please try again.');
        } finally {
            hideLoading();
        }
    }

    // Display analysis results
    function displayResults(data) {
        hideAllSections();
        
        // Display sentiment
        displaySentiment(data.sentiment);
        
        // Display emotions
        displayEmotions(data.emotions);
        
        // Display keywords
        displayKeywords(data.keywords);
        
        // Display entities
        displayEntities(data.entities);
        
        // Display summary info
        document.getElementById('wordCount').textContent = data.wordCount;
        document.getElementById('analysisTime').textContent = new Date().toLocaleTimeString();
        
        resultsSection.style.display = 'block';
    }

    // Display sentiment results
    function displaySentiment(sentiment) {
        const sentimentResult = document.getElementById('sentimentResult');
        const label = sentiment.label;
        const score = sentiment.score;
        
        // Calculate percentage and determine color
        const percentage = Math.abs(score * 100);
        const sentimentClass = label.toLowerCase();
        
        sentimentResult.className = `sentiment-result ${sentimentClass}`;
        
        sentimentResult.querySelector('.sentiment-label').textContent = label;
        sentimentResult.querySelector('.sentiment-score').textContent = `${score.toFixed(3)} (${percentage.toFixed(1)}%)`;
        
        // Animate the sentiment bar
        const sentimentFill = sentimentResult.querySelector('.sentiment-fill');
        setTimeout(() => {
            sentimentFill.style.width = `${percentage}%`;
        }, 100);
    }

    // Display emotions
    function displayEmotions(emotions) {
        const emotionsResult = document.getElementById('emotionsResult');
        emotionsResult.innerHTML = '';
        
        // Sort emotions by score (highest first)
        const sortedEmotions = Object.entries(emotions)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5); // Show top 5 emotions
        
        sortedEmotions.forEach(([emotion, score]) => {
            const emotionItem = document.createElement('div');
            emotionItem.className = 'emotion-item';
            
            const percentage = (score * 100).toFixed(1);
            
            emotionItem.innerHTML = `
                <span class="emotion-name">${emotion}</span>
                <span class="emotion-value">${percentage}%</span>
            `;
            
            emotionsResult.appendChild(emotionItem);
        });
    }

    // Display keywords
    function displayKeywords(keywords) {
        const keywordsResult = document.getElementById('keywordsResult');
        keywordsResult.innerHTML = '';
        
        if (keywords.length === 0) {
            keywordsResult.innerHTML = '<p>No significant keywords detected.</p>';
            return;
        }
        
        keywords.forEach(keyword => {
            const keywordTag = document.createElement('span');
            keywordTag.className = 'keyword-tag';
            keywordTag.textContent = `${keyword.text} (${(keyword.relevance * 100).toFixed(0)}%)`;
            keywordsResult.appendChild(keywordTag);
        });
    }

    // Display entities
    function displayEntities(entities) {
        const entitiesResult = document.getElementById('entitiesResult');
        entitiesResult.innerHTML = '';
        
        if (entities.length === 0) {
            entitiesResult.innerHTML = '<p>No significant entities detected.</p>';
            return;
        }
        
        entities.forEach(entity => {
            const entityTag = document.createElement('span');
            entityTag.className = 'entity-tag';
            entityTag.textContent = `${entity.text} (${entity.type})`;
            entityTag.title = `Confidence: ${(entity.confidence * 100).toFixed(1)}%`;
            entitiesResult.appendChild(entityTag);
        });
    }

    // Sample text for testing
    const sampleTexts = [
        "Breaking news: The local community came together today to celebrate the opening of a new public library, bringing joy and educational opportunities to families across the city. Mayor Johnson expressed her excitement about this wonderful addition to our neighborhood.",
        "In a shocking turn of events, the company announced massive layoffs affecting thousands of employees. Workers expressed anger and disappointment over the sudden decision, with many calling it a betrayal of trust.",
        "The weather forecast shows partly cloudy skies with moderate temperatures expected throughout the week. Residents can expect normal seasonal conditions with no significant weather disturbances."
    ];

    // Add sample text button functionality (optional)
    function addSampleTextButton() {
        const sampleBtn = document.createElement('button');
        sampleBtn.textContent = '📝 Try Sample Text';
        sampleBtn.className = 'clear-btn';
        sampleBtn.style.background = '#9b59b6';
        sampleBtn.onclick = () => {
            const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
            newsText.value = randomText;
            updateCharacterCount();
        };
        
        document.querySelector('.input-actions').appendChild(sampleBtn);
    }

    // Initialize
    updateCharacterCount();
    addSampleTextButton();
});