import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown'; // Import markdown renderer
import './App.css';
import pwcLogo from './assets/pwc-logo1.png';

// Table component for displaying tabular data
function Table({ data }) {
  if (!data || data.length === 0) return null;
  const headers = Object.keys(data[0]);
  return (
    <div className="table-container">
      <table className="results-table">
        <thead>
          <tr>{headers.map((h) => <th key={h}>{h.replace(/_/g, ' ')}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>{headers.map((h) => <td key={h}>{String(row[h] ?? '')}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Custom Link Renderer to open links in new tab
function LinkRenderer(props) {
  return <a href={props.href} target="_blank" rel="noopener noreferrer">{props.children}</a>;
}

// Chat message renderer
function ChatMessage({ msg }) {
  if (msg.from === 'user') {
    return <div className="message user-message">{msg.text}</div>;
  }

  if (msg.isTable && msg.tableData) {
    return (
      <div className="message bot-message wide">
        <div className="message-text"><ReactMarkdown components={{ a: LinkRenderer }}>{msg.text}</ReactMarkdown></div>
        <Table data={msg.tableData} />
      </div>
    );
  }

  return (
    <div className="message bot-message">
      <div className="message-text"><ReactMarkdown components={{ a: LinkRenderer }}>{msg.text}</ReactMarkdown></div>
    </div>
  );
}

function SuggestionPrompts({ prompts, onPromptClick }) {
  return (
    <div className="suggestion-prompts-container">
      <p className="suggestion-title">Try one of these questions:</p>
      <div className="prompts-wrapper">
        {prompts.map((prompt, index) => (
          <button key={index} className="suggestion-prompt" onClick={() => onPromptClick(prompt)}>
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function App() {
  const initialBotMessage = {
    from: 'bot',
    text: 'Welcome! I can answer questions about the provided financial data. How can I help?'
  };

  const [messages, setMessages] = useState([initialBotMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestionPrompts = [
    "What was the revenue for Beta LLC in 2021?",
    "Show me the profit before tax for Alpha Corp in 2019.",
    "Can I get the AFS for Alpha Corp for 2021?",
    "What are the principal activities of Gamma Inc?",
  ];

  // Backend URL (production)
  // const backendUrl = 'http://localhost:4000/chat';
  const backendUrl = 'https://ctosusecase-fqhwgwfmdjebh4cv.southeastasia-01.azurewebsites.net/chat';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendQuery = async (queryText) => {
    if (!queryText.trim()) return;

    const userMessage = { from: 'user', text: queryText };
    const historyForBackend = messages.slice(1).map(msg => ({ role: msg.from === 'user' ? 'user' : 'assistant', content: msg.text }));

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: queryText, history: historyForBackend }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');

      const botMessage = {
        from: 'bot',
        text: data.response, 
        isTable: data.isTable || false,
        tableData: data.tableData || null,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [...prev, { from: 'bot', text: `Sorry, an error occurred: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (prompt) => sendQuery(prompt);
  const sendMessage = () => sendQuery(input);
  const handleKeyPress = (e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } };

  // Refresh session: clear messages back to initial
  const refreshSession = () => {
    setMessages([initialBotMessage]);
    setInput('');
  };

  return (
    <div className="page-container">
      <div className="app-container">
        <header className="app-header">
          <img src={pwcLogo} alt="PwC Logo" className="pwc-logo" />
          <button className="refresh-button" onClick={refreshSession}>
            🔄 Refresh
          </button>
        </header>
        <main className="chat-container">
          <div className="messages">
            {messages.map((msg, idx) => <ChatMessage key={idx} msg={msg} />)}
            {loading && <div className="message bot-message"><div className="typing-indicator"><span></span><span></span><span></span></div></div>}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && !loading && (
            <SuggestionPrompts prompts={suggestionPrompts} onPromptClick={handleSuggestionClick} />
          )}

          <div className="input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your question here..."
              disabled={loading}
              className="chat-input"
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()} className="send-button">
              Send
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;