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

      <a
        href={tour.tripAdvisor_link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 underline font-medium hover:text-blue-600 transition"
      >
        Visit TripAdvisor
      </a>

      <button
        onClick={openAIModel}
        className="mt-4 text-purple-600 hover:underline font-medium"
      >
        View More
      </button>
    </div>
  );
};

export default TourPopup;
