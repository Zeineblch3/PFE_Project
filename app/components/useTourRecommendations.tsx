import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supbase'; 

export const useTourRecommendations = (targetTourId: string) => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    if (!targetTourId) return;

    const fetchTourAndRecommend = async () => {
      try {
        const { data: tour, error } = await supabase
          .from('tours')
          .select('id, name, description, tags, latitude, longitude')
          .eq('id', targetTourId)
          .single();

        if (error || !tour) {
          throw new Error(`Tour not found: ${error?.message || 'Unknown error'}`);
        }

        const res = await fetch("http://127.0.0.1:8000/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: tour.name,
            description: tour.description,
            tags: tour.tags, 
            latitude: tour.latitude, 
            longitude: tour.longitude, 
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

    fetchTourAndRecommend();
  }, [targetTourId]);

  return { recommendations, showRecommendations, setShowRecommendations };
};
