import React, { useState, useEffect } from 'react';

export const useTourRecommendations = (targetTourId: string) => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    console.log('Target Tour ID:', targetTourId); // Check the targetTourId value
    if (targetTourId) {
      

      const fetchRecommendations = async () => {
        try {
          const res = await fetch("http://127.0.0.1:8000/recommend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              target_tour_id: Number(targetTourId),
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
  }, [targetTourId]);  // Re-run effect if selectedTour or targetTourId changes

  return { recommendations, showRecommendations, setShowRecommendations };
};
