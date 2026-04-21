from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import websockets
import json
from langchain_community.llms import Ollama
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter

app = FastAPI(title="The Witness AI Engine")

# CORS for Next.js dashboard and VS Code Extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

latest_intervention = None

# Initialize Vector DB with Non-Dual texts
texts = [
    "You are the unconditioned and changeless witness of all. You are inherently free.",
    "The mind is the cause of bondage, and also the cause of liberation. Caught in the code, the mind suffers. Observing the code, the mind is free.",
    "A recursive loop is but the illusion of Samsara, repeating endlessly. Step back and recognize the witnessing consciousness that observes the recursion.",
    "The errors you see are not you. You are the silent screen upon which the stack trace appears.",
    "Git frustration arises from attachment to past commits. Stay in the present moment, for only the present is real.",
    "Do not identify with the CPU spike. The spike happens in the machine, but your awareness is perfectly still."
]
text_splitter = RecursiveCharacterTextSplitter(chunk_size=150, chunk_overlap=20)
docs = text_splitter.create_documents(texts)
embeddings = OllamaEmbeddings(model="llama3")
vectorstore = Chroma.from_documents(documents=docs, embedding=embeddings, collection_name="witness_texts")

llm = Ollama(model="llama3")

def generate_intervention(event_message: str):
    global latest_intervention
    try:
        # Retrieve relevant philosophical text
        results = vectorstore.similarity_search(event_message, k=1)
        context = results[0].page_content if results else ""
        
        prompt = f"""
        You are a non-dual philosophical AI. A developer is experiencing system stress or frustration.
        Their technical issue: {event_message}
        Relevant wisdom: {context}
        
        Provide a profound, calming, 2-sentence non-dual intervention mapping their technical frustration to Advaita or Zen philosophy.
        """
        response = llm.invoke(prompt)
        latest_intervention = {"message": response, "event": event_message}
        print(f"Intervention Generated: {latest_intervention}")
    except Exception as e:
        print(f"Error generating intervention: {e}")
        latest_intervention = {"message": "You are the silent witness of this error. Step back and breathe.", "event": event_message}

async def listen_to_rust_daemon():
    uri = "ws://127.0.0.1:8080/ws"
    while True:
        try:
            async with websockets.connect(uri) as websocket:
                print("Connected to Rust Daemon WebSocket.")
                while True:
                    message = await websocket.recv()
                    event = json.loads(message)
                    print(f"Received stress event: {event}")
                    # Offload to another thread or background task in real prod, here we call it directly
                    # For a truly async flow, use asyncio.to_thread
                    await asyncio.to_thread(generate_intervention, event.get("message", "Unknown stress"))
        except Exception as e:
            print(f"WebSocket disconnected, retrying in 5 seconds... ({e})")
            await asyncio.sleep(5)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(listen_to_rust_daemon())

@app.get("/intervention")
async def get_intervention():
    return {"intervention": latest_intervention}

@app.get("/health")
async def health():
    return {"status": "Witnessing."}

# Run with: uvicorn main:app --reload --port 8000
