import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';
import pwcLogo from './assets/pwc-logo1.png';
import ChartComponent from './ChartComponent';
import * as XLSX from 'xlsx';

function downloadExcel(data) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, 'exported_data.xlsx');
}

function LinkRenderer(props) {
  return <a href={props.href} target="_blank" rel="noopener noreferrer">{props.children}</a>;
}

function Table({ data }) {
  if (!data || data.length === 0) return null;
  const headers = Object.keys(data[0]);
  return (
    <div className="table-container">
      <table className="results-table">
        <thead>
          <tr>{headers.map(h => <th key={h}>{h.replace(/_/g, ' ')}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row, i) =>
            <tr key={i}>
              {headers.map(h => <td key={h}>{String(row[h] ?? '')}</td>)}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ChatMessage({ msg }) {
  const chartRef = useRef(null);

  if (msg.from === 'user') {
    return <div className="message user-message">{msg.text}</div>;
  }

  if (msg.isChart && msg.chartConfig) {
    const downloadChartAsImage = () => {
      const canvas = chartRef.current?.getCanvas();
      if (canvas) {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = 'chart.png';
        link.click();
      }
    };

    return (
      <div className="message bot-message wide">
        <div className="message-text"><ReactMarkdown components={{ a: LinkRenderer }}>{msg.text}</ReactMarkdown></div>
        <ChartComponent ref={chartRef} config={msg.chartConfig} />
        <button className="export-button" onClick={downloadChartAsImage}>Download Chart Image</button>
      </div>
    );
  }

  if (msg.isTable && msg.tableData) {
    return (
      <div className="message bot-message wide">
        <div className="message-text"><ReactMarkdown components={{ a: LinkRenderer }}>{msg.text}</ReactMarkdown></div>
        <Table data={msg.tableData} />
        <button className="export-button" onClick={() => downloadExcel(msg.tableData)}>Download Table as Excel</button>
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
        {prompts.map((prompt, idx) => (
          <button key={idx} className="suggestion-prompt" onClick={() => onPromptClick(prompt)}>{prompt}</button>
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
    "Show me a bar chart of revenue for Beta LLC in 2020",
  ];

  const backendUrl = 'https://ctosusecase-fqhwgwfmdjebh4cv.southeastasia-01.azurewebsites.net/chat';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        refreshSession();
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        clearChat();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  const sendQuery = async (queryText) => {
    if (!queryText.trim()) return;

    const userMessage = { from: 'user', text: queryText };
    const historyForBackend = messages.slice(1).map(msg => ({
      role: msg.from === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(backendUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ message: queryText, history: historyForBackend }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');

      setMessages(prev => [...prev, {
        from: 'bot',
        text: data.response,
        isTable: data.isTable || false,
        tableData: data.tableData || null,
        isChart: data.isChart || false,
        chartConfig: data.chartConfig || null,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { from: 'bot', text: `Sorry, an error occurred: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (prompt) => sendQuery(prompt);
  const sendMessage = () => sendQuery(input);
  const handleKeyPress = (e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } };

  const refreshSession = () => {
    setMessages([initialBotMessage]);
    setInput('');
  };

  const clearChat = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <div className="page-container" role="main" aria-label="Chatbot interface">
      <div className="app-container">
        <header className="app-header">
          <img src={pwcLogo} alt="PwC Logo" className="pwc-logo" />
          <button className="refresh-button" title="Refresh chat (Ctrl+R)" aria-label="Refresh chat session" onClick={refreshSession}>🔄</button>
          <button className="clear-button" title="Clear chat (Ctrl+L)" aria-label="Clear chat" onClick={clearChat}>❌</button>
        </header>
        <main className="chat-container">
          <div className="messages">
            {messages.length === 0 && !loading && (
              <div className="message bot-message">
                <div className="message-text">The chat is empty. Type your question to start.</div>
              </div>
            )}
            {messages.map((msg, idx) => <ChatMessage key={idx} msg={msg} />)}
            {loading && (
              <div className="message bot-message typing-indicator-container" aria-live="polite" aria-busy="true">
                <div className="typing-indicator"><span /><span /><span /></div>
                <div className="typing-text">Analyzing data...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && !loading && (
            <SuggestionPrompts prompts={suggestionPrompts} onPromptClick={handleSuggestionClick} />
          )}

          <div className="input-container">
            <input
              type="text"
              className="chat-input"
              placeholder="Type your question here..."
              value={input}
              disabled={loading}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              aria-label="Chat input"
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()} className="send-button" aria-label="Send message">Send</button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;