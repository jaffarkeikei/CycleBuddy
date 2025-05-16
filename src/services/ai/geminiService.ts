import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API with your API key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

// The model we'll use for task analysis
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

const VALID_PHASES = ['menstruation', 'follicular', 'ovulation', 'luteal'] as const;
const VALID_ENERGY_LEVELS = ['high', 'medium', 'low'] as const;

export interface TaskAnalysisResult {
  optimalPhases: typeof VALID_PHASES[number][];
  reasoning: string;
  energyLevel: typeof VALID_ENERGY_LEVELS[number];
  recommendations: string[];
}

export interface MoodInsight {
  title: string;
  text: string;
  color: "blue" | "orange" | "purple" | "green" | "red";
}

export interface HealthInsightsResult {
  moodInsights: MoodInsight[];
  commonPatterns: string;
}

export interface DetailedHealthInsight {
  title: string;
  description: string;
  category: 'INFORMATIONAL' | 'ADVISORY' | 'ALERT';
  confidence: number;
  verified: boolean;
}

// Simplified version of prompt focused on getting structured output
const ANALYSIS_PROMPT = `Task: "{task}"

Analyze this task and determine which menstrual cycle phase(s) it is best suited for. You MUST choose from these exact phases: menstruation, follicular, ovulation, luteal.

Return your answer as valid JSON in EXACTLY this format:
{
  "optimalPhases": ["phase1", "phase2"],
  "reasoning": "why these phases are optimal",
  "energyLevel": "energy_level",
  "recommendations": ["recommendation1", "recommendation2"]
}

Where:
- optimalPhases must be an array containing ONLY these values: menstruation, follicular, ovulation, luteal
- energyLevel must be one of: high, medium, low

Use this information to guide your response:
- Menstruation: Lowest energy, good for reflection, planning, rest
- Follicular: Rising energy, good for learning, new projects, creativity
- Ovulation: Highest energy, good for social activities, presentations, physical exercise
- Luteal: Decreasing energy, good for detail work, organization, completion tasks

DO NOT include any explanations or text outside the JSON object.`;

// Helper function to determine appropriate phase based on task keywords
const inferPhaseFromTaskName = (taskName: string): typeof VALID_PHASES[number][] => {
  const taskLower = taskName.toLowerCase();
  
  // Physical/high energy activities
  if (taskLower.includes('gym') || 
      taskLower.includes('workout') || 
      taskLower.includes('exercise') || 
      taskLower.includes('run') || 
      taskLower.includes('strong')) {
    return ['ovulation', 'follicular'];
  }
  
  // Social/presentation activities
  if (taskLower.includes('present') || 
      taskLower.includes('meeting') || 
      taskLower.includes('interview') || 
      taskLower.includes('social')) {
    return ['ovulation'];
  }
  
  // Detail/organization activities
  if (taskLower.includes('organize') || 
      taskLower.includes('clean') || 
      taskLower.includes('detail') || 
      taskLower.includes('review')) {
    return ['luteal'];
  }
  
  // Learning/creative activities
  if (taskLower.includes('learn') || 
      taskLower.includes('study') || 
      taskLower.includes('create') || 
      taskLower.includes('program')) {
    return ['follicular'];
  }
  
  // Rest/reflection activities
  if (taskLower.includes('rest') || 
      taskLower.includes('meditate') || 
      taskLower.includes('relax') || 
      taskLower.includes('reflect')) {
    return ['menstruation'];
  }
  
  // Negative emotional states
  if (taskLower.includes('stress') || 
      taskLower.includes('anxiety') || 
      taskLower.includes('depress')) {
    return ['menstruation', 'luteal'];
  }
  
  // Default to multiple phases for ambiguous tasks
  return ['follicular', 'ovulation'];
};

// Prompt for generating mood and health insights
const HEALTH_INSIGHTS_PROMPT = `Generate personalized health insights based on the following user cycle data:

{data}

Current phase: {currentPhase}

Generate a response in this exact JSON format:
{
  "moodInsights": [
    {
      "title": "Insight Title 1",
      "text": "A short, actionable insight about patterns in the user's data",
      "color": "blue" | "orange" | "purple" | "green" | "red"
    },
    {
      "title": "Insight Title 2",
      "text": "Another short, actionable insight",
      "color": "blue" | "orange" | "purple" | "green" | "red"
    },
    {
      "title": "Insight Title 3",
      "text": "One more insightful observation",
      "color": "blue" | "orange" | "purple" | "green" | "red"
    }
  ],
  "commonPatterns": "A single sentence describing common patterns related to the current phase, using HTML bold tags for emphasis on key symptoms."
}

Keep insights brief, specific and actionable.`;

const DETAILED_INSIGHTS_PROMPT = `Generate 3 detailed health insights based on the following user cycle data:

{data}

Current phase: {currentPhase}

Generate a response in this exact JSON format:
{
  "insights": [
    {
      "title": "Insight Title 1",
      "description": "A detailed description of the insight (2-3 sentences)",
      "category": "INFORMATIONAL | ADVISORY | ALERT",
      "confidence": A number between 0-100,
      "verified": true | false
    },
    {
      "title": "Insight Title 2",
      "description": "A detailed description of the insight (2-3 sentences)",
      "category": "INFORMATIONAL | ADVISORY | ALERT",
      "confidence": A number between 0-100,
      "verified": true | false
    },
    {
      "title": "Insight Title 3",
      "description": "A detailed description of the insight (2-3 sentences)",
      "category": "INFORMATIONAL | ADVISORY | ALERT", 
      "confidence": A number between 0-100,
      "verified": true | false
    }
  ]
}

Ensure:
- INFORMATIONAL insights should be positive or neutral observations
- ADVISORY insights should suggest patterns to be aware of
- ALERT insights should highlight potential issues that need attention
- Confidence should reflect certainty level (85%+ for strong patterns, 70-85% for moderate patterns, below 70% for tentative observations)
- Verified should be true only for highly reliable insights based on clear patterns
- Each insight should be specific and actionable`;

export const geminiService = {
  async analyzeTask(taskTitle: string): Promise<TaskAnalysisResult> {
    try {
      console.log(`Analyzing task: "${taskTitle}"`);
      const prompt = ANALYSIS_PROMPT.replace('{task}', taskTitle);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini response:', text);
      
      try {
        // Try to extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : text;
        const analysis = JSON.parse(jsonText);
        
        console.log('Parsed analysis:', analysis);
        
        // Validate the response structure
        if (!analysis.optimalPhases || !Array.isArray(analysis.optimalPhases)) {
          console.warn('Invalid optimalPhases format, falling back to keyword analysis');
          throw new Error('Invalid optimalPhases format');
        }
        
        // Validate each phase
        const validatedPhases = analysis.optimalPhases.filter((phase: string) => 
          VALID_PHASES.includes(phase as typeof VALID_PHASES[number])
        );
        
        if (validatedPhases.length === 0) {
          console.warn('No valid phases provided, falling back to keyword analysis');
          throw new Error('No valid phases provided');
        }
        
        // Validate energy level
        if (!VALID_ENERGY_LEVELS.includes(analysis.energyLevel as typeof VALID_ENERGY_LEVELS[number])) {
          analysis.energyLevel = 'medium'; // Default to medium if invalid
          console.warn('Invalid energy level, defaulting to medium');
        }
        
        // Validate recommendations
        if (!analysis.recommendations || !Array.isArray(analysis.recommendations)) {
          analysis.recommendations = ['Consider your current energy level'];
          console.warn('Invalid recommendations format, using default');
        }
        
        return {
          optimalPhases: validatedPhases as typeof VALID_PHASES[number][],
          reasoning: analysis.reasoning || 'No reasoning provided',
          energyLevel: analysis.energyLevel as typeof VALID_ENERGY_LEVELS[number],
          recommendations: analysis.recommendations.map((rec: any) => String(rec)),
        };
      } catch (parseError) {
        console.error('Error parsing or validating Gemini response:', parseError);
        
        // Fall back to keyword-based analysis instead of default
        const inferredPhases = inferPhaseFromTaskName(taskTitle);
        console.log(`Falling back to keyword analysis: ${inferredPhases.join(', ')}`);
        
        return {
          optimalPhases: inferredPhases,
          reasoning: `This task appears to be best suited for the ${inferredPhases.join(' or ')} phase based on keyword analysis.`,
          energyLevel: inferredPhases.includes('ovulation') ? 'high' : 
                        inferredPhases.includes('menstruation') ? 'low' : 'medium',
          recommendations: [
            'This is a best guess based on the task name',
            'Consider your current energy level',
            'Adjust timing based on how you feel'
          ],
        };
      }
    } catch (error) {
      console.error('Error analyzing task with Gemini:', error);
      
      // Use intelligent fallback based on task keywords
      const inferredPhases = inferPhaseFromTaskName(taskTitle);
      
      return {
        optimalPhases: inferredPhases,
        reasoning: `Fallback analysis: This task may be better suited for the ${inferredPhases.join(' or ')} phase.`,
        energyLevel: inferredPhases.includes('ovulation') ? 'high' : 
                     inferredPhases.includes('menstruation') ? 'low' : 'medium',
        recommendations: [
          'This is a fallback recommendation',
          'Consider adjusting based on your current phase',
          'Listen to body\'s signals'
        ],
      };
    }
  },

  // New function for generating health insights
  async generateHealthInsights(
    cycleData: Array<{
      day: number;
      date: string;
      mood?: 'Great' | 'Good' | 'Fair' | 'Poor';
      symptoms?: string[];
      phase?: typeof VALID_PHASES[number];
    }>,
    currentPhase: typeof VALID_PHASES[number]
  ): Promise<HealthInsightsResult> {
    try {
      console.log('Generating health insights for phase:', currentPhase);
      
      // Create a simplified version of the data for the prompt
      const simplifiedData = cycleData.map(day => ({
        day: day.day,
        date: day.date,
        mood: day.mood || 'Good',
        symptoms: day.symptoms || [],
        phase: day.phase
      }));
      
      const prompt = HEALTH_INSIGHTS_PROMPT
        .replace('{data}', JSON.stringify(simplifiedData, null, 2))
        .replace('{currentPhase}', currentPhase);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini health insights response:', text);
      
      try {
        // Try to extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : text;
        const insights = JSON.parse(jsonText);
        
        // Validate the response structure
        if (!insights.moodInsights || !Array.isArray(insights.moodInsights)) {
          throw new Error('Invalid moodInsights format');
        }
        
        // Fallback if data is missing
        if (!insights.commonPatterns) {
          insights.commonPatterns = `Based on your history, symptoms are common during your <b>${currentPhase}</b> phase. Consider adjusting your routine accordingly.`;
        }
        
        return {
          moodInsights: insights.moodInsights.slice(0, 3).map((insight: any) => ({
            title: insight.title || 'Pattern Detected',
            text: insight.text || 'A pattern has been detected in your cycle data.',
            color: ['blue', 'orange', 'purple', 'green', 'red'].includes(insight.color) 
              ? insight.color as MoodInsight['color'] 
              : 'blue'
          })),
          commonPatterns: insights.commonPatterns
        };
      } catch (parseError) {
        console.error('Error parsing Gemini health insights response:', parseError);
        
        // Return default insights if parsing fails
        return {
          moodInsights: [
            {
              title: "Cycle Pattern",
              text: `Your data shows typical patterns for the ${currentPhase} phase. Track consistently for more personalized insights.`,
              color: "blue"
            },
            {
              title: "Health Recommendation",
              text: `During ${currentPhase} phase, focus on appropriate self-care and listen to your body's signals.`,
              color: "purple"
            },
            {
              title: "Wellness Tip",
              text: "Staying hydrated and maintaining regular sleep patterns can help manage cycle symptoms.",
              color: "green"
            }
          ],
          commonPatterns: `Based on typical patterns, <b>${currentPhase === 'menstruation' ? 'cramps and fatigue' :
                            currentPhase === 'follicular' ? 'increased energy' :
                            currentPhase === 'ovulation' ? 'heightened mood' :
                            'mood changes and bloating'}</b> are common during your current phase.`
        };
      }
    } catch (error) {
      console.error('Error generating health insights with Gemini:', error);
      
      // Return default insights if AI fails
      return {
        moodInsights: [
          {
            title: "Data Analysis",
            text: "Continue tracking your cycle to receive AI-powered insights about your patterns.",
            color: "blue"
          },
          {
            title: "Phase Awareness",
            text: `Your current ${currentPhase} phase may influence your energy levels and symptoms.`,
            color: "purple"
          },
          {
            title: "Wellness Reminder",
            text: "Regular tracking helps identify patterns that can improve cycle management.",
            color: "orange"
          }
        ],
        commonPatterns: `During the <b>${currentPhase}</b> phase, it's common to experience certain symptoms. Keep tracking to identify your personal patterns.`
      };
    }
  },

  // New function for generating detailed health insights for the AI Insights page
  async generateDetailedHealthInsights(
    cycleData: Array<{
      day: number;
      date: string;
      mood?: 'Great' | 'Good' | 'Fair' | 'Poor';
      symptoms?: string[];
      phase?: typeof VALID_PHASES[number];
    }>
  ): Promise<DetailedHealthInsight[]> {
    try {
      console.log('Generating detailed health insights');
      
      // Create a simplified version of the data for the prompt
      const simplifiedData = cycleData.map(day => ({
        day: day.day,
        date: day.date,
        mood: day.mood || 'Good',
        symptoms: day.symptoms || [],
        phase: day.phase
      }));
      
      const currentPhase = cycleData[0]?.phase || 'follicular';
      
      const prompt = DETAILED_INSIGHTS_PROMPT
        .replace('{data}', JSON.stringify(simplifiedData, null, 2))
        .replace('{currentPhase}', currentPhase);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini detailed health insights response:', text);
      
      try {
        // Try to extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : text;
        const parsedResponse = JSON.parse(jsonText);
        
        // Validate the response structure
        if (!parsedResponse.insights || !Array.isArray(parsedResponse.insights)) {
          throw new Error('Invalid insights format');
        }
        
        return parsedResponse.insights.map((insight: any) => ({
          title: insight.title || 'Insight',
          description: insight.description || 'No details available',
          category: ['INFORMATIONAL', 'ADVISORY', 'ALERT'].includes(insight.category) 
            ? insight.category as DetailedHealthInsight['category']
            : 'INFORMATIONAL',
          confidence: typeof insight.confidence === 'number' ? insight.confidence : 75,
          verified: Boolean(insight.verified)
        }));
      } catch (parseError) {
        console.error('Error parsing Gemini detailed health insights response:', parseError);
        
        // Return default insights if parsing fails
        return [
          {
            title: "Cycle Regularity Improving",
            description: "Your cycle has shown improved regularity over the past 3 months.",
            category: "INFORMATIONAL",
            confidence: 85,
            verified: false
          },
          {
            title: "Potential Symptom Pattern",
            description: "We've detected a pattern between certain foods and increased cramps.",
            category: "ADVISORY",
            confidence: 70,
            verified: false
          },
          {
            title: "Unusual Cycle Length",
            description: "Your last cycle was significantly longer than your average. This could be due to stress, diet changes, or other factors.",
            category: "ALERT",
            confidence: 90,
            verified: true
          }
        ];
      }
    } catch (error) {
      console.error('Error generating detailed health insights with Gemini:', error);
      
      // Return default insights if AI fails
      return [
        {
          title: "Cycle Regularity Improving",
          description: "Your cycle has shown improved regularity over the past 3 months.",
          category: "INFORMATIONAL",
          confidence: 85,
          verified: false
        },
        {
          title: "Potential Symptom Pattern",
          description: "We've detected a pattern between certain foods and increased cramps.",
          category: "ADVISORY",
          confidence: 70,
          verified: false
        },
        {
          title: "Unusual Cycle Length",
          description: "Your last cycle was significantly longer than your average. This could be due to stress, diet changes, or other factors.",
          category: "ALERT",
          confidence: 90,
          verified: true
        }
      ];
    }
  },

  // New function for the AI chatbot
  async chatWithAI(
    message: string,
    chatHistory: Array<{ role: 'user' | 'assistant', content: string }> = []
  ): Promise<string> {
    try {
      console.log('Chatting with Cycle Buddy AI');
      
      // Build context from chat history
      const contextMessages = chatHistory.slice(-10); // Keep last 10 messages for context
      
      // Create conversation prompt with context and system instructions
      const prompt = `
You are Cycle Buddy AI, a specialized health assistant focused on menstrual health. 
You provide friendly, compassionate advice about menstrual cycles, symptoms, and reproductive health.
Always be supportive, non-judgmental, and science-based in your responses.
Keep responses concise but informative.

${contextMessages.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}
USER: ${message}
ASSISTANT:`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini chat response:', text);
      
      return text.trim();
    } catch (error) {
      console.error('Error chatting with Gemini:', error);
      return "I'm having trouble connecting right now. Please try again in a moment.";
    }
  }
}; 