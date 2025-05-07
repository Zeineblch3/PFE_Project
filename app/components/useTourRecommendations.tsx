import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supbase'; // adjust to your actual Supabase client path

export const useTourRecommendations = (targetTourId: string) => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    if (!targetTourId) return;

    const fetchTourAndRecommend = async () => {
      try {
        // Step 1: Fetch full tour data from Supabase
        const { data: tour, error } = await supabase
          .from('tours')
          .select('id, name, description, tags, latitude, longitude')
          .eq('id', targetTourId)
          .single();

        if (error || !tour) {
          throw new Error(`Tour not found: ${error?.message || 'Unknown error'}`);
        }

        // Step 2: Send the full tour data to FastAPI
        const res = await fetch("http://127.0.0.1:8000/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: tour.name,
            description: tour.description,
            tags: tour.tags, // assuming `tags` is a list or string
            latitude: tour.latitude, // add latitude
            longitude: tour.longitude, // add longitude
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
