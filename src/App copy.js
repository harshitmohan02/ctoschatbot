import React, { useState } from 'react';

function App() {
  const [messages, setMessages] = useState([{ from: 'bot', text: 'Hello! Ask me anything.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { from: 'user', text: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('https://chatbotexcelpbi-azhjh5bpbzckaeff.southeastasia-01.azurewebsites.net/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { from: 'bot', text: data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { from: 'bot', text: 'Sorry, something went wrong.' }]);
    }
    setLoading(false);
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20, fontFamily: 'Arial' }}>
      <h2>Power BI Chatbot</h2>
      <div style={{ border: '1px solid #ccc', borderRadius: 8, minHeight: 300, padding: 12, overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.from === 'user' ? 'right' : 'left', margin: '12px 0' }}>
            <span style={{
              display: 'inline-block',
              backgroundColor: msg.from === 'user' ? '#0078d7' : '#e1e1e1',
              color: msg.from === 'user' ? 'white' : 'black',
              padding: '8px 16px',
              borderRadius: 16,
              maxWidth: '75%'
            }}>
              {msg.text}
            </span>
          </div>
        ))}
        {loading && <p>Typing...</p>}
      </div>
      <input
        type="text"
        placeholder="Ask your question..."
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyPress}
        disabled={loading}
        style={{ width: '100%', padding: 12, marginTop: 12, boxSizing: 'border-box' }}
      />
      <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ marginTop: 8, padding: '10px 20px' }}>
        Send
      </button>
    </div>
  );
}

export default App;