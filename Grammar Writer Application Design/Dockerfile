FROM python:3.12-slim-bookworm

WORKDIR /app

RUN apt-get update \
    && apt-get upgrade -y perl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8080
EXPOSE 8080

CMD ["python", "server.py"]
