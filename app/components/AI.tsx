import React, { useState } from 'react';
import { X, ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';

interface AIProps {
  onClose: () => void;
  recommendations: any[];
}

const AI: React.FC<AIProps> = ({ onClose, recommendations }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % recommendations.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + recommendations.length) % recommendations.length);
  };

  return (
<div className="fixed inset-0 flex items-center justify-center z-50 p-4">
  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden relative border border-purple-500/20">
    {/* Close Button */}
    <button
      onClick={onClose}
      className="absolute top-3 right-3 text-white bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition-all duration-300 hover:rotate-90 z-10"
    >
      <X className="h-5 w-5" />
    </button>

    {/* Header */}
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-center">
      <h2 className="text-3xl font-bold text-white">Recommended Tours</h2>
      <p className="text-white/80 mt-4 text-sm max-w-md mx-auto">
        Curated just for you — a journey of connection and discovery.
      </p>
    </div>

    {/* Scrollable Content */}
    <div className="p-6 space-y-4 text-white overflow-y-auto max-h-[calc(90vh-150px)] custom-scrollbar mr-1">
      {recommendations.length > 0 ? (
        <>
          <h3 className="text-xl font-semibold text-white text-center">
            {recommendations[currentIndex].name}
          </h3>
          <p className="text-white/80 text-sm leading-relaxed">
            {recommendations[currentIndex].description}
          </p>
          {/* Image */}
          <div className="w-full h-56 bg-gray-700 rounded-xl overflow-hidden shadow-inner">
            <img
              src={recommendations[currentIndex].photo_url}
              alt={recommendations[currentIndex].name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={handlePrev}
              className="flex items-center space-x-2 text-white bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-full transition"
            >
              <ArrowLeft size={18} />
              <span>Previous</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center space-x-2 text-white bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-full transition"
            >
              <span>Next</span>
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="mt-4 text-center">
            <a
              href={recommendations[currentIndex].tripAdvisor_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium underline transition"
            >
              View on TripAdvisor <ExternalLink className="ml-2 w-4 h-4" />
            </a>
          </div>
        </>
      ) : (
        <p className="text-white/70 text-center">No recommendations available.</p>
      )}
    </div>
  </div>
</div>

  );
};

export default AI;
