import { supabase } from "@/lib/supbase";

type TouristWithEvent = {
  name: string;
  email: string;
  country: string;
  event_name: string;
  notes: string;
};

export const fetchTouristsWithEvents = async (): Promise<TouristWithEvent[]> => {
  try {
    const { data: tourists, error: touristError } = await supabase
      .from("tourists")
      .select("id, name, email, country, notes, tour_event_id"); 

    if (touristError) {
      console.error("Error fetching tourists:", touristError.message);
      throw new Error("Failed to fetch tourists: " + touristError.message);
    }

    const { data: events, error: eventsError } = await supabase
      .from("tour_events")
      .select("id, event_name");

    if (eventsError) {
      console.error("Error fetching events:", eventsError.message);
      throw new Error("Failed to fetch events: " + eventsError.message);
    }

    const touristsWithEvents: TouristWithEvent[] = [];

    tourists.forEach((tourist: any) => {
      if (tourist.tour_event_id) {
        const event = events.find((event: any) => event.id === tourist.tour_event_id);

        if (event) {
          touristsWithEvents.push({
            name: tourist.name,
            email: tourist.email,
            country: tourist.country,
            event_name: event.event_name,
            notes: tourist.notes,
          });
        }
      }
    });

    return touristsWithEvents;
  } catch (error) {
    console.error("Error fetching tourists with events:", error);
    throw new Error("Failed to fetch tourists with events.");
  }
};
