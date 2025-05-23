import React from 'react';

interface ChapterCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  chapterName: string;
}

const ChapterCompletionModal: React.FC<ChapterCompletionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  chapterName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 overflow-y-auto h-full w-full z-50 flex justify-center items-center backdrop-blur-sm">
      <div className="relative mx-auto p-6 border border-[#EC444B] w-full max-w-md shadow-lg rounded-lg bg-black text-white">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full border border-[#EC444B] mb-4">
            <svg
              className="h-6 w-6 text-[#EC444B]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-white mb-3">
            Chapter Completed!
          </h3>
          
          <p className="text-gray-300 mb-4">
            You've completed "{chapterName}".
          </p>
          
          <p className="text-sm text-gray-400 mb-6">
            If you continue talking in this chapter, I'll remember our conversation and carry it into the next chapter.
          </p>
          
          <div className="flex justify-center gap-3">
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-transparent border border-gray-600 text-gray-300 text-sm font-medium rounded-md hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300"
            >
              Continue
            </button>
            
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-[#EC444B] text-white text-sm font-medium rounded-md hover:bg-[#d83a40] focus:outline-none focus:ring-2 focus:ring-[#EC444B] transition-all duration-300"
            >
              Mark Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterCompletionModal; 