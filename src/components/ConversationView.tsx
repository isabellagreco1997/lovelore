Here's the fixed version with all closing brackets added:

```typescript
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
                        
                        return processFormattedText(message.content);
                      })()}
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
              disabled={!userInput.trim() || sendingMessage}
              className={`px-6 rounded-xl ${
                userInput.trim() && !sendingMessage
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
```