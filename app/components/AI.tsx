import React, { useState, useEffect } from 'react';

interface AIProps {
  onClose: () => void;
  recommendations: any[];
}

const AI: React.FC<AIProps> = ({ onClose, recommendations }) => {
  const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0);

  const handleNextRecommendation = () => {
    setCurrentRecommendationIndex((prevIndex) => (prevIndex + 1) % recommendations.length);
  };

  const handlePrevRecommendation = () => {
    setCurrentRecommendationIndex(
      (prevIndex) => (prevIndex - 1 + recommendations.length) % recommendations.length
    );
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-w-md">
        <h2 className="text-xl font-semibold mb-4">Recommended Tours for You</h2>

        {recommendations.length > 0 ? (
          <>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {recommendations[currentRecommendationIndex].name}
                </h3>
                <p className="text-gray-600">{recommendations[currentRecommendationIndex].description}</p>
              </div>

              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={handlePrevRecommendation}
                  className="px-4 py-2 bg-gray-300 rounded-full text-white hover:bg-gray-400 transition"
                >
                  Prev
                </button>
                <button
                  onClick={handleNextRecommendation}
                  className="px-4 py-2 bg-gray-300 rounded-full text-white hover:bg-gray-400 transition"
                >
                  Next
                </button>
              </div>

              <a
                href={recommendations[currentRecommendationIndex].tripAdvisor_link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 text-blue-500 underline hover:text-blue-600 font-medium"
              >
                Visit TripAdvisor
              </a>
            </div>
          </>
        ) : (
          <p className="text-gray-600">No recommendations available.</p>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full text-red-500 hover:underline font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default AI;
