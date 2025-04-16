import React from 'react';
import Carousel from './Carousel';

interface TourPopupProps {
  tour: any;
  currentImageIndex: number;
  onNextImage: () => void;
  onPrevImage: () => void;
  onClose: () => void;
  openAIModel: () => void;
}

const TourPopup: React.FC<TourPopupProps> = ({
  tour,
  currentImageIndex,
  onNextImage,
  onPrevImage,
  onClose,
  openAIModel,
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-xl text-center border border-gray-300 transition-all duration-500 max-w-md relative">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 px-3 py-1 bg-gray-400 text-white rounded-full hover:bg-gray-600 transition"
      >
        ✕
      </button>

      <h3 className="text-2xl font-semibold text-gray-900 mb-3">{tour.name}</h3>

      <Carousel
        photos={tour.photo_urls}
        currentIndex={currentImageIndex}
        onNext={onNextImage}
        onPrev={onPrevImage}
      />

      <h3 className="text-lg font-semibold text-gray-800 mt-3">${tour.price}</h3>

      <p className="text-gray-700 my-2">{tour.description}</p>

       {/* Container for left-aligned TripAdvisor and Book Now links */}
       <div className="flex justify-between mt-4">
        <div className="flex flex-col space-y-2 items-start w-[120px]">
          <a
            href={tour.tripAdvisor_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline font-medium hover:text-blue-600 transition"
          >
            Visit TripAdvisor
          </a>
          <a
            href={tour.book_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline font-medium hover:text-blue-600 transition"
          >
            Book Now
          </a>
        </div>

        {/* Right-aligned Recommendation Button */}
        <div>
        <button
          onClick={openAIModel}
          className="mt-4 inline-flex items-center px-4 py-2 rounded-full bg-purple-50 text-purple-700 border border-purple-300 hover:bg-purple-100 hover:border-purple-400 transform hover:-translate-y-1 transition-all"
        >
          🔍 ✨ View Magic Picks
        </button>

        </div>
      </div>
    </div>
  );
};

export default TourPopup;