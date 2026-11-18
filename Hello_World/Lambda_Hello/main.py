from fastapi import FastAPI

from mangum import Mangum
app = FastAPI()

@app.get("/")
async def home():
    return {
        "message": "Nilesh - GET request for AWS Lambda!"
        }
handler = Mangum(app)