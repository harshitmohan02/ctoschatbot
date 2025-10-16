// App.js
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import pwcLogo from './assets/pwc-logo1.png';

// ChartJS imports are unchanged and can be kept for future use.

// --- NEW ---: A component to render data in a clean, scrollable table
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
                        <tr key={i}>{headers.map((h) => <td key={h}>{String(row[h])}</td>)}</tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// --- MODIFIED ---: Updated to handle table and plain text messages
function ChatMessage({ msg }) {
    if (msg.from === 'user') {
        return <div className="message user-message">{msg.text}</div>;
    }
    
    // Bot message with a table
    if (msg.isTable && msg.tableData) {
        return (
            <div className="message bot-message wide">
                <div className="message-text">{msg.text}</div>
                <Table data={msg.tableData} />
            </div>
        );
    }
    
    // Default bot message (plain text)
    return <div className="message bot-message"><div className="message-text">{msg.text}</div></div>;
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
    const [messages, setMessages] = useState([{ from: 'bot', text: 'Welcome! I am your AI Assistant. How can I help you today?' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // NEW: Updated suggestion prompts
    const suggestionPrompts = [
        "What is the total turnover for all companies in 2022?",
        "Show the top 5 companies with the highest retained profits.",
        "Download the financial report for Aerospace Technology Systems Corp Sdn Bhd",
        "What was the share capital for 'E8 Ventures Sdn Bhd' in their latest financial year?",
    ];

    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000/chat';

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendQuery = async (queryText) => {
        if (!queryText.trim()) return;

        const userMessage = { from: 'user', text: queryText };
        const historyForBackend = messages.map(msg => ({ role: msg.from === 'user' ? 'user' : 'assistant', content: msg.text }));

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: queryText, history: historyForBackend }),
            });

            // --- NEW: DYNAMIC RESPONSE HANDLING (JSON or FILE) ---
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") !== -1) {
                // This is an Excel file download
                const blob = await res.blob();
                const disposition = res.headers.get('content-disposition');
                let filename = "financial-report.xlsx";
                if (disposition && disposition.indexOf('attachment') !== -1) {
                    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                    const matches = filenameRegex.exec(disposition);
                    if (matches != null && matches[1]) {
                        filename = matches[1].replace(/['"]/g, '');
                    }
                }
                
                // Create a link and trigger the download
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                
                // Add a confirmation message to the chat
                setMessages((prev) => [...prev, { from: 'bot', text: `Your download for "${filename}" has started.` }]);

            } else {
                // This is a standard JSON chat response
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Server error');
                
                const botMessage = {
                    from: 'bot',
                    text: data.response,
                    isTable: data.isTable || false,
                    tableData: data.tableData || null,
                };
                setMessages((prev) => [...prev, botMessage]);
            }

        } catch (err) {
            setMessages((prev) => [...prev, { from: 'bot', text: `Sorry, an error occurred: ${err.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestionClick = (prompt) => sendQuery(prompt);
    const sendMessage = () => sendQuery(input);
    const handleKeyPress = (e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } };

    return (
        <div className="page-container">
            <div className="app-container">
                <header className="app-header">
                    <img src={pwcLogo} alt="PwC Logo" className="pwc-logo" />
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