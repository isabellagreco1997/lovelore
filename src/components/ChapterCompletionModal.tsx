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
    <div className="fixed inset-0 bg-indigo-950 bg-opacity-80 overflow-y-auto h-full w-full z-50 flex justify-center items-center backdrop-blur-sm">
      <div className="relative mx-auto p-5 border border-indigo-600 w-full max-w-md shadow-lg rounded-md bg-indigo-900 text-white">
        {/* Decorative elements */}
        <div className="absolute top-2 left-2 w-1 h-1 rounded-full bg-purple-400 opacity-60"></div>
        <div className="absolute top-4 right-4 w-1 h-1 rounded-full bg-blue-300 opacity-60"></div>
        <div className="absolute bottom-4 left-10 w-1 h-1 rounded-full bg-purple-300 opacity-60"></div>
        <div className="absolute top-10 right-2 w-1 h-1 rounded-full bg-blue-300 opacity-60"></div>
        
        <div className="mt-3 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-800 border border-purple-400">
            <svg
              className="h-8 w-8 text-purple-300"
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
          
          <h3 className="text-xl leading-6 font-medium text-purple-200 mt-4 flex items-center justify-center">
            <span className="mr-2">✦</span> Chapter Objective Completed! <span className="ml-2">✦</span>
          </h3>
          
          <div className="mt-4 px-7 py-3 bg-indigo-800 rounded-lg">
            <p className="text-purple-100">
              Congratulations! You've successfully completed the objective for "{chapterName}".
            </p>
          </div>
          
          <div className="flex justify-center gap-4 mt-5">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-700 text-indigo-200 text-base font-medium rounded-md shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 border border-indigo-600 transition-colors"
            >
              Continue Playing
            </button>
            
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-purple-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 border border-purple-500 transition-colors"
            >
              Mark Completed & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterCompletionModal; 