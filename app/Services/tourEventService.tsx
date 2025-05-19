import { supabase } from "@/lib/supbase";
import { Tourist } from "../dashboard/tourEvents";

export const fetchTourEvents = async () => {
  const { data, error } = await supabase
    .from("tour_events")
    .select("id, event_name, date_from, date_to, tours(name), archived")
    .order("date_from", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch tour events");
  }

  return data.map((event) => ({
    ...event,
    tours: Array.isArray(event.tours) ? event.tours[0] : event.tours,
  }));
};

export const fetchTourEventById = async (eventId: string) => {
  try {
    const { data: eventData, error: eventError } = await supabase
      .from("tour_events")
      .select(`
        id, 
        event_name, 
        date_from, 
        date_to, 
        tour_id, 
        tours(name), 
        archived
      `)
      .eq("id", eventId)
      .single();

    if (eventError) {
      throw new Error("Failed to fetch event: " + eventError.message);
    }

    const { data: touristData, error: touristError } = await supabase
      .from("tourists")
      .select("id, name, email, country, notes")
      .eq("tour_event_id", eventId); 

    if (touristError) {
      throw new Error("Failed to fetch tourists: " + touristError.message);
    }

    return {
      ...eventData,
      tours: eventData.tours ? (Array.isArray(eventData.tours) ? eventData.tours[0] : eventData.tours) : null,
      tourists: touristData || [], 
    };
  } catch (error) {
    console.error("Error fetching tour event details:", error);
    throw error;
  }
};

export const archiveTourEvent = async (eventId: string) => {
  const { error } = await supabase
    .from("tour_events")
    .update({ archived: true })
    .eq("id", eventId);

  if (error) {
    throw new Error("Failed to archive event");
  }

  return { success: true };
};

export const unarchiveTourEvent = async (eventId: string) => {
  const { error } = await supabase
    .from("tour_events")
    .update({ archived: false })
    .eq("id", eventId);

  if (error) {
    throw new Error("Failed to unarchive tour event: " + error.message);
  }

  return { success: true, message: "Tour event unarchived successfully" };
};

export const updateTourEventTourist = async (eventId: string, tourists: Tourist[]) => {
  try {
    const { success, message } = await saveTourists(tourists, eventId);
    if (!success) {
      return { success: false, message };
    }

    return { success: true, message: "Tourist information updated successfully." };
  } catch (error) {
    console.error("Unexpected error updating tourists:", error);
    return { success: false, message: "Unexpected error." };
  }
};


export const createTourEvent = async (eventName: string, dateFrom: string, dateTo: string, selectedTour: string | null, tourists: Tourist[]) => {
  const { data: eventData, error: eventError } = await supabase
    .from("tour_events")
    .insert([
      {
        event_name: eventName,
        date_from: dateFrom,
        date_to: dateTo,
        tour_id: selectedTour,
      },
    ])
    .select("id");

  if (eventError) {
    console.error("Error creating tour event:", eventError.message);
    return { success: false, message: "Error creating tour event." };
  }

  const { success, message } = await saveTourists(tourists, eventData[0].id);
  if (!success) {
    return { success: false, message };
  }

  return { success: true, eventId: eventData[0].id }; 
};

export const saveTourists = async (tourists: Tourist[], eventId: string) => {
  const { data: existingTourists, error: existingTouristsError } = await supabase
    .from("tourists")
    .select("id")
    .eq("tour_event_id", eventId);

  if (existingTouristsError) {
    console.error("Error fetching existing tourists:", existingTouristsError.message);
    return { success: false, message: "Error fetching existing tourists." };
  }

  const existingTouristIds = existingTourists.map((tourist: any) => tourist.id);

  const touristsToUpdate = tourists.filter((tourist) => existingTouristIds.includes(tourist.id));
  
  const touristsToAdd = tourists.filter((tourist) => !existingTouristIds.includes(tourist.id));

  if (touristsToAdd.length > 0) {
    const { data: touristsData, error: touristsError } = await supabase
      .from("tourists")
      .upsert(
        touristsToAdd.map((tourist) => ({
          ...(tourist.id ? { id: tourist.id } : {}), 
          name: tourist.name,
          email: tourist.email,
          country: tourist.country,
          notes: tourist.notes,
          tour_event_id: eventId,
        }))
      )
      .select("id");

    if (touristsError) {
      console.error("Error saving tourists:", touristsError.message);
      return { success: false, message: "Error saving new tourists." };
    }
  }

  if (touristsToUpdate.length > 0) {
    const { data: updatedTourists, error: updateError } = await supabase
      .from("tourists")
      .upsert(
        touristsToUpdate.map((tourist) => ({
          id: tourist.id, 
          name: tourist.name,
          email: tourist.email,
          country: tourist.country,
          notes: tourist.notes,
          tour_event_id: eventId,
        }))
      )
      .select("id");

    if (updateError) {
      console.error("Error updating tourists:", updateError.message);
      return { success: false, message: "Error updating existing tourists." };
    }
  }

  return { success: true };
};



export const linkTouristsToEvent = async (eventId: string, touristsData: any[]) => {
  const touristLinks = touristsData.map((tourist) => ({
    tour_event_id: eventId,
    tourist_id: tourist.id,
  }));

  const { error: linkError } = await supabase
    .from("tour_event_tourist")
    .upsert(touristLinks);

  if (linkError) {
    console.error("Error linking tourists to event:", linkError.message);
    return { success: false, message: "Error linking tourists to event." };
  }

  return { success: true, message: "Tourists linked to event successfully." };
};

export const deleteTourist = async (touristId: string) => {
  const { error } = await supabase
    .from("tourists")
    .delete()
    .eq("id", touristId);

  if (error) throw new Error("Failed to delete tourist");

  return { success: true };
};

export const deleteTourEventWithTourists = async (eventId: string) => {
  try {
    const { error: touristError } = await supabase
      .from("tourists")
      .delete()
      .eq("tour_event_id", eventId);

    if (touristError) {
      throw new Error("Failed to delete linked tourists: " + touristError.message);
    }

    const { error: eventError } = await supabase
      .from("tour_events")
      .delete()
      .eq("id", eventId);

    if (eventError) {
      throw new Error("Failed to delete tour event: " + eventError.message);
    }

    return { success: true, message: "Tour event and tourists deleted." };
  } catch (error) {
    console.error("Error deleting event with tourists:", error);
    return { success: false, message: (error as Error).message };
  }
};

