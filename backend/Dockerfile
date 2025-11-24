FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1
WORKDIR /app/backend

# Install system dependencies required by some geospatial packages
RUN apt-get update && apt-get install -y --no-install-recommends \
	build-essential \
	gdal-bin libgdal-dev \
	libpq-dev \
	curl \
	&& rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN python -m pip install --upgrade pip setuptools wheel
RUN python -m pip install -r requirements.txt

# Copy application code
COPY backend /app/backend

EXPOSE 8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
