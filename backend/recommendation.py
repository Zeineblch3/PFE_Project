import json
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from sentence_transformers import SentenceTransformer, util
import math
from fastapi.middleware.cors import CORSMiddleware


# Initialize FastAPI and SentenceTransformer model
app = FastAPI()
model = SentenceTransformer('all-MiniLM-L6-v2')

# Define data models
class Tour(BaseModel):
    tour_id: int
    name: str
    description: str
    latitude: float
    longitude: float

class RecommendRequest(BaseModel):
    tours: List[Tour]
    target_tour_id: int
    top_n: int = 5
    alpha: float = 0.7  # Tuning parameter

# Allow CORS requests from any origin (or specify the correct origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Change this to your specific frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Haversine function to calculate proximity
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Radius of Earth in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    return R * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))

# Load the dataset from a local file
with open('dataset.json', 'r') as file:
    tours_data = json.load(file)

# Convert the dataset into Tour objects
tours = [Tour(**tour) for tour in tours_data]

# Endpoint for recommendations
@app.post("/recommend")
def recommend(req: RecommendRequest):
    # Convert to DataFrame
    df = pd.DataFrame([tour.dict() for tour in req.tours])
    target = df[df['tour_id'] == req.target_tour_id].iloc[0]

    # Generate embeddings
    embeddings = model.encode(df['description'].tolist(), convert_to_tensor=True)
    target_embedding = model.encode(target['description'], convert_to_tensor=True)
    semantic_scores = util.cos_sim(target_embedding, embeddings).cpu().numpy().flatten()

    # Compute geographic proximity
    distances = df.apply(lambda row: haversine(target['latitude'], target['longitude'], row['latitude'], row['longitude']), axis=1)
    proximity_scores = 1 - (distances - distances.min()) / (distances.max() - distances.min())

    # Combine the scores
    combined_scores = req.alpha * semantic_scores + (1 - req.alpha) * proximity_scores
    df['score'] = combined_scores
    df = df[df['tour_id'] != req.target_tour_id]

    # Return top N recommendations
    top_results = df[['tour_id', 'name', 'score']].sort_values(by='score', ascending=False).head(req.top_n)
    return top_results.to_dict(orient='records')

