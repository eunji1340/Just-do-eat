from fastapi import FastAPI

app = FastAPI(title="fastapi-score", version="cbf_v1")

@app.get("/")
def root():
    return {"message": "Hello World"}