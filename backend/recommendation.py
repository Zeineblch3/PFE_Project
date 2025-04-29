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
    tags: List[str]  # Include tags in the Tour model


class RecommendRequest(BaseModel):
    target_tour_id: int
    top_n: int = 3
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

# Use model_dump() instead of dict() as dict() is deprecated in Pydantic
df = pd.DataFrame([tour.model_dump() for tour in tours])  # Updated to use model_dump()

# Haversine function to calculate proximity
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Radius of Earth in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    return R * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))

def compute_tag_overlap_score(tags1, tags2):
    set1, set2 = set(tags1), set(tags2)
    if not set1 or not set2:
        return 0.0
    return len(set1 & set2) / len(set1 | set2)

# Endpoint for recommendations
@app.post("/recommend")
def recommend(req: RecommendRequest):
    df = pd.DataFrame([tour.model_dump() for tour in tours])

    target = df[df['tour_id'] == req.target_tour_id].iloc[0]

    # Combine name, description, and tags for TF-IDF
    df['combined_text'] = df['name'] + " " + df['description'] + " " + df['tags'].apply(lambda x: " ".join(x))

    tfidf = TfidfVectorizer(stop_words="english")
    tfidf_matrix = tfidf.fit_transform(df['combined_text'].tolist())

    target_idx = df[df['tour_id'] == req.target_tour_id].index[0]
    target_vector = tfidf_matrix[target_idx]

    # Semantic similarity
    semantic_scores = cosine_similarity(target_vector, tfidf_matrix).flatten()

    # Proximity score using Haversine
    distances = df.apply(
        lambda row: haversine(target['latitude'], target['longitude'], row['latitude'], row['longitude']),
        axis=1
    )
    proximity_scores = 1 - (distances - distances.min()) / (distances.max() - distances.min())

    # Tag Overlap Score (Jaccard Similarity)
    tag_scores = df['tags'].apply(lambda tags: compute_tag_overlap_score(target['tags'], tags))

    # Final Combined Score
    combined_scores = req.alpha * semantic_scores + (1 - req.alpha) * proximity_scores + 0.2 * tag_scores
    df['score'] = combined_scores
    df = df[df['tour_id'] != req.target_tour_id]

    top_results = df.sort_values(by='score', ascending=False).head(req.top_n)
    return top_results.to_dict(orient='records')
