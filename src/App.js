// App.js

import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import pwcLogo from './assets/pwc-logo1.png';

// All your ChartJS imports and registrations remain the same
import {
  Bar,
  Line,
  Pie,
  Doughnut,
  Radar,
  PolarArea,
  Bubble,
  Scatter,
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadarController,
  PolarAreaController,
  BubbleController,
  ScatterController,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadarController,
  PolarAreaController,
  BubbleController,
  ScatterController,
  Tooltip,
  Legend,
  Title,
);

const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
    },
    scales: {
      x: {
        ticks: {
          autoSkip: false,
          maxRotation: 45,
          minRotation: 30,
          font: { size: 12 },
        },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { font: { size: 12 } },
        grid: { color: '#eee' },
      },
    },
};
  
const chartComponentsMap = {
    bar: Bar,
    line: Line,
    pie: Pie,
    doughnut: Doughnut,
    radar: Radar,
    polararea: PolarArea,
    bubble: Bubble,
    scatter: Scatter,
};

// --- NEW ---: A component to render data in a clean, scrollable table
function Table({ data }) {
  if (!data || data.length === 0) return null;

  const headers = Object.keys(data[0]);

  return (
    <div className="table-container">
      <table className="results-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header.replace(/_/g, ' ')}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {headers.map((header) => (
                <td key={header}>{String(row[header])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
  
// --- MODIFIED ---: Updated to handle chart, table, and plain text messages
function ChatMessage({ msg }) {
  // User message
  if (msg.from === 'user') {
    return (
      <div className="message user-message" style={{ alignSelf: 'flex-end' }}>
        {msg.text}
      </div>
    );
  }

  // Bot message with a chart
  if (msg.isChart && msg.chartConfig) {
    const { type, data, options } = msg.chartConfig;
    const chartTypeKey = type ? type.toLowerCase() : 'bar';
    const ChartComponent = chartComponentsMap[chartTypeKey];

    if (!ChartComponent) {
      return <div className="message bot-message error" style={{ alignSelf: 'flex-start' }}>Unsupported chart type: {type}</div>;
    }
    
    const finalOptions = { ...defaultOptions, ...options };

    return (
      <div className="message bot-message" style={{ alignSelf: 'flex-start' }}>
        <div style={{ marginBottom: '15px', whiteSpace: 'pre-wrap' }}>{msg.text}</div>
        <div className="chart-container" style={{ minHeight: '350px', maxWidth: '700px', width: '100%' }}>
          <ChartComponent data={data} options={finalOptions} />
        </div>
      </div>
    );
  }

  // --- NEW ---: Bot message with a table
  if (msg.isTable && msg.tableData) {
    return (
      <div className="message bot-message" style={{ alignSelf: 'flex-start', maxWidth: '800px', width: '100%', padding: '15px' }}>
        <div style={{ marginBottom: '15px', whiteSpace: 'pre-wrap' }}>{msg.text}</div>
        <Table data={msg.tableData} />
      </div>
    );
  }

  // Default bot message (plain text)
  return (
    <div className="message bot-message" style={{ whiteSpace: 'pre-wrap', alignSelf: 'flex-start' }}>
      {msg.text}
    </div>
  );
}

// --- MODIFIED ---: Component to render the suggestion prompts with a title
function SuggestionPrompts({ prompts, onPromptClick }) {
    return (
      <div className="suggestion-prompts-container">
        <p className="suggestion-title">Here are the top 5 questions.</p>
        <div className="prompts-wrapper">
          {prompts.map((prompt, index) => (
            <button 
              key={index} 
              className="suggestion-prompt"
              onClick={() => onPromptClick(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    );
}

function App() {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Welcome! I am your AI Tax Assistant. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Using the latest suggestion prompts you provided
  const suggestionPrompts = [
    "Can you provide a list of entities where the Effective Tax Rate (%) compared to the Statutory Tax Rate shows more than a 10% ETR positive variance threshold with difference?",
    "Can you compare the total disallowed and allowable donations claimed? What is the proportionate percentage of the deduction?",
    "Create a pie graph for top 5 ETR vs client with ETR descending",
    "Create a line graph for QE vs CA?",
    "What's the tax position for Tropicana for the latest YA?"
  ];

  const backendUrl = 'https://chatbotexcelpbi-azhjh5bpbzckaeff.southeastasia-01.azurewebsites.net/chat';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendQuery = async (queryText) => {
    if (!queryText.trim()) return;

    const userMessage = { from: 'user', text: queryText };
    
    const historyForBackend = messages.map(msg => ({
        role: msg.from === 'user' ? 'user' : 'assistant',
        content: msg.text
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            message: queryText,
            history: historyForBackend
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { from: 'bot', text: data.error || 'Sorry, something went wrong on the server.' },
        ]);
        setLoading(false);
        return;
      }
      
      // --- MODIFIED ---: Capturing all possible response types from the backend
      const botMessage = {
        from: 'bot',
        text: data.response,
        isChart: data.isChart || false,
        chartConfig: data.chartConfig || null,
        isTable: data.isTable || false,
        tableData: data.tableData || null,
      };
      setMessages((prev) => [...prev, botMessage]);

    } catch (err) {
      console.error("Fetch error:", err);
      setMessages((prev) => [
        ...prev,
        { from: 'bot', text: 'Sorry, a network error occurred. Please check the connection.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (prompt) => {
    sendQuery(prompt);
  };

  const sendMessage = () => {
    sendQuery(input);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showSuggestions = messages.length === 1;

  // The final JSX render structure
  return (
    <div className="page-container">
      <div className="app-container">
        <header className="app-header" aria-label="PwC logo header">
          <img src={pwcLogo} alt="PwC Logo" className="pwc-logo" />
        </header>
        <main className="chat-container" role="main">
          <div className="messages" aria-live="polite" aria-atomic="true">
            {messages.map((msg, idx) => (
              <ChatMessage key={idx} msg={msg} />
            ))}
            {loading && (
              <div className="message bot-message" tabIndex="0">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {showSuggestions && !loading && (
            <SuggestionPrompts 
              prompts={suggestionPrompts} 
              onPromptClick={handleSuggestionClick} 
            />
          )}

          <div className="input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your question here..."
              aria-label="Chat input"
              disabled={loading}
              className="chat-input"
              spellCheck={false}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="send-button"
            >
              Send
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;