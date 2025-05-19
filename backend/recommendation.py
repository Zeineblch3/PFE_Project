import json
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import math
from fastapi.middleware.cors import CORSMiddleware
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

class Tour(BaseModel):
    id: int
    name: str
    description: str
    latitude: float
    longitude: float
    photo_urls: List[str]
    tripAdvisor_link: str
    tags: List[str]

class RecommendRequest(BaseModel):
    name: str
    description: str
    latitude: float
    longitude: float
    tags: Optional[List[str]] = None  
    top_n: int = 3
    alpha: float = 0.7


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

with open('dataset.json', 'r') as file:
    tours_data = json.load(file)

for tour in tours_data:
    if isinstance(tour["photo_urls"], str):
        tour["photo_urls"] = [tour["photo_urls"]]

tours = [Tour(**tour) for tour in tours_data]
df = pd.DataFrame([tour.dict() for tour in tours]) 

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
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

@app.post("/recommend")
def recommend(req: RecommendRequest):
    if req.tags is None:
        req.tags = []

    df['combined_text'] = df['name'] + " " + df['description'] + " " + df['tags'].apply(lambda x: " ".join(x))
    target_text = f"{req.name} {req.description} {' '.join(req.tags)}"  

    tfidf = TfidfVectorizer(stop_words="english")
    tfidf_matrix = tfidf.fit_transform([target_text] + df['combined_text'].tolist())
    target_vector = tfidf_matrix[0]
    dataset_vectors = tfidf_matrix[1:]

    semantic_scores = cosine_similarity(target_vector, dataset_vectors).flatten()

    distances = df.apply(
        lambda row: haversine(req.latitude, req.longitude, row['latitude'], row['longitude']),
        axis=1
    )
    proximity_scores = 1 - (distances - distances.min()) / (distances.max() - distances.min())

    if req.tags:
        tag_scores = df['tags'].apply(lambda tags: compute_tag_overlap_score(req.tags, tags))
    else:
        tag_scores = pd.Series([1.0] * len(df))  

    semantic_weight = 0.50
    proximity_weight = 0.05
    tag_weight = 0.45



    combined_scores = (
        semantic_weight * semantic_scores +
        proximity_weight * proximity_scores +
        tag_weight * tag_scores
    )
    df['score'] = combined_scores


    top_results = df.sort_values(by='score', ascending=False).head(req.top_n)
    return top_results.to_dict(orient='records')
