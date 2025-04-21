import json
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import math
from fastapi.middleware.cors import CORSMiddleware
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Initialize FastAPI
app = FastAPI()

# Define data models
class Tour(BaseModel):
    tour_id: int
    name: str
    description: str
    latitude: float
    longitude: float
    photo_url: str
    tripAdvisor_link: str


class RecommendRequest(BaseModel):
    target_tour_id: int
    top_n: int = 5
    alpha: float = 0.7

# Allow CORS requests from any origin (or specify the correct origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Change this to your specific frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Load the dataset from a local file
with open('dataset.json', 'r') as file:
    tours_data = json.load(file)

# Convert the dataset into Tour objects
tours = [Tour(**tour) for tour in tours_data]

# Haversine function to calculate proximity
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Radius of Earth in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    return R * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))

# Endpoint for recommendations
@app.post("/recommend")
def recommend(req: RecommendRequest):
    # Use the backend-loaded dataset
    df = pd.DataFrame([tour.dict() for tour in tours])  # Changed model_dump() to dict()

    target = df[df['tour_id'] == req.target_tour_id].iloc[0]

   # Generate TF-IDF vectorizer for the names and descriptions
    tfidf = TfidfVectorizer(stop_words="english")
    # Concatenate the name and description for each tour
    descriptions_and_names = df['name'] + " " + df['description']
    tfidf_matrix = tfidf.fit_transform(descriptions_and_names.tolist())

    # Get the target tour's TF-IDF vector (name + description)
    target_idx = df[df['tour_id'] == req.target_tour_id].index[0]
    target_vector = tfidf_matrix[target_idx]

    # Calculate semantic similarity using cosine similarity
    semantic_scores = cosine_similarity(target_vector, tfidf_matrix).flatten()


    # Compute geographic proximity using the haversine function
    distances = df.apply(lambda row: haversine(target['latitude'], target['longitude'], row['latitude'], row['longitude']), axis=1)
    proximity_scores = 1 - (distances - distances.min()) / (distances.max() - distances.min())

    # Combine the semantic similarity and proximity scores
    combined_scores = req.alpha * semantic_scores + (1 - req.alpha) * proximity_scores
    df['score'] = combined_scores
    df = df[df['tour_id'] != req.target_tour_id]  # Remove the target tour from the results

    # Return top N recommendations
    top_results = df.sort_values(by='score', ascending=False).head(req.top_n)
    return top_results.to_dict(orient='records')
