from fastapi import FastAPI, Request
from pydantic import BaseModel
from typing import List
import pandas as pd
import math
from sentence_transformers import SentenceTransformer, util

app = FastAPI()
model = SentenceTransformer('all-MiniLM-L6-v2')

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
    alpha: float = 0.7

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    return R * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))

@app.post("/recommend")
def recommend(req: RecommendRequest):
    df = pd.DataFrame([tour.dict() for tour in req.tours])
    target = df[df['tour_id'] == req.target_tour_id].iloc[0]

    embeddings = model.encode(df['description'].tolist(), convert_to_tensor=True)
    target_embedding = model.encode(target['description'], convert_to_tensor=True)

    semantic_scores = util.cos_sim(target_embedding, embeddings).numpy().flatten()
    distances = df.apply(lambda row: haversine(target['latitude'], target['longitude'], row['latitude'], row['longitude']), axis=1)
    max_distance = distances.max()
    proximity_scores = 1 - (distances / max_distance)

    combined_scores = req.alpha * semantic_scores + (1 - req.alpha) * proximity_scores
    df['score'] = combined_scores
    df = df[df['tour_id'] != req.target_tour_id]

    top_results = df.sort_values(by='score', ascending=False).head(req.top_n)
    return top_results.to_dict(orient='records')
