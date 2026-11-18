from fastapi import FastAPI, UploadFile, File, HTTPException
import httpx

app = FastAPI()

# Your Copilot API details
COPILOT_BASE_URL = "https://copilot.moodys.com"  # Replace with your Copilot API base URL
COPILOT_KEY_ID = "7c622828-0114-4c1d-873a-59324ffcba12"
COPILOT_API_KEY = "12789f7ca9f9051a65725057ab925c913b71aff339d8f3f467cbde860e31923b"

def get_headers():
    return {
        "X-API-Key-Id": COPILOT_KEY_ID,
        "X-API-Key": COPILOT_API_KEY,
        "Content-Type": "application/json",
    }

@app.post("/call-copilot/file-manager/upload")
async def upload_file_to_file_manager(file: UploadFile = File(...)):
    url = f"{COPILOT_BASE_URL}/v1/file-manager/"
    headers = get_headers()
    cookies = get_cookies()
    async with httpx.AsyncClient() as client:
        files = {"file": (file.filename, await file.read(), file.content_type)}
        response = await client.post(url, headers=headers, cookies=cookies, files=files)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()

# GET /v2/system/files/{file_id} example - retrieve file info
@app.get("/call-copilot/system/files/{file_id}")
async def get_file(file_id: str):
    url = f"{COPILOT_BASE_URL}/v2/system/files/{file_id}"
    headers = get_headers()
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()

