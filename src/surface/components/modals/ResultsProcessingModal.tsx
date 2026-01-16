import React from 'react';

interface ResultsProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  // We will add the sprout data prop later
}

const ResultsProcessingModal: React.FC<ResultsProcessingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white/10 border border-white/20 rounded-lg shadow-lg p-6 w-full max-w-3xl text-white">
        <h2 className="text-2xl font-bold mb-4">Research Results</h2>
        <div className="results-content mb-4">
          {/* ResearchResultsView will be rendered here */}
          <p>Research content will be displayed here.</p>
        </div>
        <div className="action-bar flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700">Accept</button>
          <button className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700">Add Note</button>
          <button className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700">Promote to Field</button>
        </div>
      </div>
    </div>
  );
};

export default ResultsProcessingModal;
