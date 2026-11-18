from fastapi import FastAPI, HTTPException
app = FastAPI()
name_list = []
@app.get("/list") # Read data
def get_list():
   if len(name_list)==0:
       raise HTTPException(status_code=404, detail="name_list is empty")
   return {
       "List of names": name_list
   }
@app.post("/list") # Create data
def add_list(name: str):
   if name is None:
       raise HTTPException(status_code=404, detail="Name not passed")
   name_list.append(name)
   return {
       "message": f"{name} successfully inserted into the name_list"
   }
@app.put("/list")
def update_list(index: int, name: str):
   if index>len(name_list)-1:
       raise HTTPException(status_code=403, detail="Index does not exist")
   if name is None:
       raise HTTPException(status_code=404, detail="Name is not passed")
   prev_name = name_list[index]
   name_list[index] = name
   return {
       "message": f"{prev_name} successfully updates with given name - {name}"
   }
@app.delete("/list")
def delete_list(name: str):
   if name is None:
       raise HTTPException(status_code=404, detail="Name is not passed")
   if name not in name_list:
       raise HTTPException(status_code=403, detail="Name doesn't exist in the list")
   name_list.remove(name)
   return {
       "message": f"{name} successfully deleted from name_list"
   }