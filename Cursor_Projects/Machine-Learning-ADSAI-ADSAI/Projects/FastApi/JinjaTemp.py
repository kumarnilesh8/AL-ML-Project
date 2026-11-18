from fastapi import FastAPI, Request, Form, status
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates  
app = FastAPI()
templates = Jinja2Templates(directory = "templates")
@app.get("/")
async def home_page(request: Request):
    # render home.html 
    return templates.TemplateResponse("home.html", {"request": request})
@app.post("/submit")
async def submit(request: Request, name: str = Form(...), age: int = Form(...)):
    response = RedirectResponse(url=request.url_for("details"), status_code = status.HTTP_303_SEE_OTHER)
    response.set_cookie("name", name)
    response.set_cookie("age", age)
    return response

@app.get("/details")
async def details(request: Request):
    name = request.cookies.get("name")
    age = request.cookies.get("age")
    return templates.TemplateResponse("details.html", {"request": request, "name": name, "age": age})