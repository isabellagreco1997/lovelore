import React, { useRef, useState } from 'react';
import ChapterCompletionModal from './ChapterCompletionModal';

function ConversationView({ messages, userInput = '', sendingMessage, handleInputChange, handleKeyDown, handleSendMessage, showCompletionModal, setShowCompletionModal, handleMarkChapterCompleted, currentChapterName }) {
  const messagesEndRef = useRef(null);

  const processFormattedText = (text) => {
    const segments = [];

    const processQuotes = (text) => {
      const parts = text.split(/(\"[^\"]*\")/g);
      return parts.map((part, index) => {
        if (part.startsWith('"') && part.endsWith('"')) {
          return <span key={index} className="text-pink-300">{part}</span>;
        }
        return part;
      });
    };

    const processBold = (text) => {
      const parts = text.split(/(\*\*[^\*]*\*\*)/g);
      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    const processItalic = (text) => {
      const parts = text.split(/(\*[^\*]*\*)/g);
      const italicParts = parts.map((part, index) => {
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={index}>{part.slice(1, -1)}</em>;
        }
        return part;
      });
      return italicParts;
    };

    const paragraphs = text.split('\n\n');
    paragraphs.forEach((paragraph, index) => {
      if (paragraph.trim()) {
        const quotedText = processQuotes(paragraph);
        const boldText = quotedText.map(part => 
          typeof part === 'string' ? processBold(part) : part
        ).flat();
        const italicText = boldText.map(part =>
          typeof part === 'string' ? processItalic(part) : part
        ).flat();
        
        segments.push(
          <p key={index} className="mb-4 last:mb-0">
            {italicText}
          </p>
        );
      }
    });

    return segments;
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Minimal Story Header */}
      <div className="bg-gradient-to-b from-[#1a0a1f] to-black border-b border-pink-900/30 px-4 md:px-8 py-3 md:py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl md:text-2xl font-semibold text-pink-200">
            {currentChapterName}
          </h1>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto">
          {messages && messages.length > 0 && (
            <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex mb-8 last:mb-0 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`rounded-xl max-w-[80%] md:max-w-[70%] ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-pink-800 to-purple-800 text-white'
                        : 'bg-[#1a0a1f] text-pink-200'
                    } p-4 md:p-6`}
                  >
                    <div className="prose prose-invert">
                      {processFormattedText(message.content)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-gradient-to-t from-[#1a0a1f] to-black border-t border-pink-900/30 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-4">
            <textarea
              value={userInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              className="flex-1 bg-[#1a0a1f] text-pink-200 placeholder-pink-300/30 rounded-xl border border-pink-900/30 focus:border-pink-800/50 focus:ring-1 focus:ring-pink-800/50 p-4 resize-none h-[60px] focus:outline-none transition-all duration-300"
              disabled={sendingMessage}
            />
            <button
              onClick={handleSendMessage}
              disabled={!userInput?.trim() || sendingMessage}
              className={`px-6 rounded-xl ${
                userInput?.trim() && !sendingMessage
                  ? 'bg-gradient-to-r from-pink-800 to-purple-800 hover:from-pink-700 hover:to-purple-700 text-white'
                  : 'bg-pink-900/20 text-pink-300/50 cursor-not-allowed'
              } transition-all duration-300`}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Chapter Completion Modal */}
      <ChapterCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onConfirm={handleMarkChapterCompleted}
        chapterName={currentChapterName}
      />
    </div>
  );
}

export default ConversationView;