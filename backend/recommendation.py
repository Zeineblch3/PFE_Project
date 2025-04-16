import json
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from sentence_transformers import SentenceTransformer, util, InputExample, losses
import math
from fastapi.middleware.cors import CORSMiddleware
from torch.utils.data import DataLoader

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
    photo_url: str

class RecommendRequest(BaseModel):
    target_tour_id: int
    top_n: int = 5
    alpha: float = 0.5

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

# Prepare data for fine-tuning (use pairs for training)
train_examples = []
for tour in tours_data:
    description = tour['description']
    # Use the description as both the "positive" pair and the "negative" pair for simplicity
    # Normally, you'd use two different sentences for each pair
    train_examples.append(InputExample(texts=[description, description], label=1))  # Positive pair

# Create a DataLoader for batching
train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=16)

# Use a loss function, e.g., CosineSimilarityLoss
train_loss = losses.CosineSimilarityLoss(model)

# Fine-tune the model
model.fit(train_objectives=[(train_dataloader, train_loss)], epochs=1, warmup_steps=100)

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

    # Generate embeddings for the descriptions
    embeddings = model.encode(df['description'].tolist(), convert_to_tensor=True)
    target_embedding = model.encode(target['description'], convert_to_tensor=True)

    # Calculate semantic similarity scores
    semantic_scores = util.cos_sim(target_embedding, embeddings).cpu().numpy().flatten()

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
