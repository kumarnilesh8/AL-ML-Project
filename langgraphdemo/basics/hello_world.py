from typing import Any, TypedDict
from langgraph.graph import END, START, StateGraph

class HelloWolrdState(TypedDict):
    message:str

def hello(state: HelloWolrdState):
    print(f"Hello Node: {state['message']}")
    return {"message": "Hello " + state['message']}


def bye(state: HelloWolrdState):
    print(f"Bye Node: {state['message']}")
    return {"message": "Bye " + state['message']}

graph = StateGraph[Any, None, Any, Any](HelloWolrdState)
graph.add_node("hello", hello)
graph.add_node("bye", bye)


graph.add_edge(START, "hello")
graph.add_edge("hello", "bye")
graph.add_edge("bye", END)

runnable=graph.compile()
output=runnable.invoke({"message": "Nilesh"})
print(output)