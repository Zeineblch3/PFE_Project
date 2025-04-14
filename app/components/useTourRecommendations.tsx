import React, { useState, useEffect } from 'react';

export const useTourRecommendations = (selectedTour: any[], targetTourId: string) => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    console.log('Target Tour ID:', targetTourId); // Check the targetTourId value
    if (targetTourId) {
      // Format tours for the recommendation API
      const formattedTours = selectedTour.map((tour: any) => ({
        tour_id: tour.id,
        name: tour.name,
        description: tour.description,
        latitude: tour.latitude,
        longitude: tour.longitude,
      }));

      const fetchRecommendations = async () => {
        try {
          const res = await fetch("http://127.0.0.1:8000/recommend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tours: formattedTours,      // Send only selected tour
              target_tour_id: targetTourId, // The ID of the clicked tour
              top_n: 5,
              alpha: 0.7,
            }),
          });

          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }

          const data = await res.json();
          setRecommendations(data);
          setShowRecommendations(true);
        } catch (err) {
          console.error("Recommendation error:", err);
          alert(`Failed to fetch recommendations: ${err}`);
        }
      };

      fetchRecommendations();
    }
  }, [selectedTour, targetTourId]);  // Re-run effect if selectedTour or targetTourId changes

  return { recommendations, showRecommendations, setShowRecommendations };
};
