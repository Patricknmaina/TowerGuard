# Deployment Guide

## Prerequisites

- Python 3.11+
- MongoDB 6+ (WiredTiger storage engine)
- 2GB RAM minimum
- 10GB disk space

## Production Deployment

### 1. Server Setup

#### Install System Dependencies

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y python3.11 python3.11-venv python3-pip
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo tee /etc/apt/trusted.gpg.d/mongodb.gpg >/dev/null
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo apt-get install -y gdal-bin libgdal-dev
```

**CentOS/RHEL:**
```bash
sudo yum install -y python3.11 python3-pip
cat <<'EOF' | sudo tee /etc/yum.repos.d/mongodb-org-6.0.repo
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF
sudo yum install -y mongodb-org
sudo yum install -y gdal-bin libgdal-dev
```

### 2. Database Setup

```bash
# Start MongoDB and enable the service
sudo systemctl enable --now mongod

# Create a database user / permissions
mongosh <<'EOF'
use admin
db.createUser({
  user: "wangaari_user",
  pwd: "secure_password_here",
  roles: [{ role: "readWriteAnyDatabase", db: "admin" }]
})
use wangaari_db
db.createCollection("sites")
EOF
```

### 3. Application Setup

```bash
# Create application user
sudo useradd -m -s /bin/bash wangaari
sudo su - wangaari

# Clone or copy application
cd /home/wangaari
# (copy your backend directory here)

# Create virtual environment
cd backend
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Configure environment
cat > .env << EOF
MONGODB_URI=mongodb://wangaari_user:secure_password_here@localhost:27017/wangaari_db
MONGODB_DB=wangaari_db
ENVIRONMENT=production
EOF

# Load canonical datasets into Mongo
python - <<'PY'
from app.db.session import get_db
from app.core.loaders import load_all_data

db = next(get_db())
load_all_data(db)
PY
```

### 4. Systemd Service

Create `/etc/systemd/system/wangaari-api.service`:

```ini
[Unit]
Description=Wangaari Maathai API
After=network.target mongod.service

[Service]
Type=notify
User=wangaari
Group=wangaari
WorkingDirectory=/home/wangaari/backend
Environment="PATH=/home/wangaari/backend/venv/bin"
ExecStart=/home/wangaari/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable wangaari-api
sudo systemctl start wangaari-api
sudo systemctl status wangaari-api
```

### 5. Nginx Reverse Proxy

Install Nginx:
```bash
sudo apt-get install nginx
```

Create `/etc/nginx/sites-available/wangaari`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/wangaari /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL with Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Docker Deployment

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  db:
    image: mongo:6.0
    environment:
      MONGO_INITDB_ROOT_USERNAME: wangaari_user
      MONGO_INITDB_ROOT_PASSWORD: secure_password
      MONGO_INITDB_DATABASE: wangaari_db
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      MONGODB_URI: mongodb://wangaari_user:secure_password@db:27017/wangaari_db
      MONGODB_DB: wangaari_db
      ENVIRONMENT: production
    depends_on:
      - db
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000

volumes:
  mongo_data:
```

Create `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gdal-bin \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Deploy:
```bash
docker-compose up -d
```

Seed canonical datasets via the API container:
```bash
docker-compose exec api python - <<'PY'
from app.db.session import get_db
from app.core.loaders import load_all_data

db = next(get_db())
load_all_data(db)
PY
```

## Environment Variables

Production `.env`:

```bash
# Database
MONGODB_URI=mongodb://user:password@host:27017/database
MONGODB_DB=database

# Environment
ENVIRONMENT=production

# API Keys (optional, for real data services)
NASA_POWER_API_KEY=your_key_here
SOILGRIDS_API_KEY=your_key_here

# CORS (restrict in production)
CORS_ORIGINS=["https://your-frontend.com"]
```

## Monitoring

### Health Check Endpoint

```bash
curl http://localhost:8000/api/health
```

### Logs

```bash
# Systemd service logs
sudo journalctl -u wangaari-api -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database Monitoring

```bash
mongosh --eval "use wangaari_db; db.stats();"
mongosh --eval "use wangaari_db; db.sites.count();"
```

## Backup

### Database Backup

```bash
# Backup
mongodump --username wangaari_user --password secure_password --db wangaari_db --out /var/backups/wangaari/db_$(date +%Y%m%d)

# Restore
mongorestore --username wangaari_user --password secure_password --db wangaari_db /var/backups/wangaari/db_20231201/wangaari_db
```

### Automated Backups

Create `/etc/cron.daily/wangaari-backup`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/wangaari"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database backup
mongodump --username wangaari_user --password secure_password --db wangaari_db --archive=$BACKUP_DIR/db_$DATE.archive --gzip

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete
```

Make executable:
```bash
sudo chmod +x /etc/cron.daily/wangaari-backup
```

## Performance Tuning

### Database

Edit `/etc/mongod.conf` to tune WiredTiger cache and networking:

```yaml
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 1
net:
  maxIncomingConnections: 200
  bindIp: 0.0.0.0
```

Restart MongoDB after making changes:

```bash
sudo systemctl restart mongod
```

### Application

Tune the MongoDB client connection (optional) by adding URI options or adjusting `MongoClient` parameters:

```python
from pymongo import MongoClient

MongoClient(
    settings.mongodb_uri,
    maxPoolSize=50,
    minPoolSize=5,
    serverSelectionTimeoutMS=5000,
    tls=True  # if you are connecting over TLS
)
```

### Uvicorn Workers

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

## Security Checklist

- [ ] Change default passwords
- [ ] Restrict CORS origins
- [ ] Enable SSL/TLS
- [ ] Configure firewall (ufw/firewalld)
- [ ] Restrict database access
- [ ] Set up fail2ban
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Implement rate limiting

## Troubleshooting

### Service won't start

```bash
sudo systemctl status wangaari-api
sudo journalctl -u wangaari-api -n 50
```

### Database connection errors

```bash
# Test connection
mongosh --username wangaari_user --password secure_password --eval "db.stats()"

# Check MongoDB service
sudo systemctl status mongod
```

### Performance issues

```bash
# Check system resources
htop
df -h
free -m

# Inspect MongoDB performance
mongosh --username wangaari_user --password secure_password --eval "db.adminCommand({ serverStatus: 1 })"
```

## Scaling

### Horizontal Scaling

1. Deploy multiple API instances
2. Use load balancer (Nginx, HAProxy)
3. Shared database backend
4. Consider read replicas for heavy read loads

### Vertical Scaling

1. Increase server resources (CPU, RAM)
2. Optimize database queries
3. Add database indexes
4. Enable query caching

## Support

For issues or questions:
- Check logs: `journalctl -u wangaari-api`
- Review documentation: `/docs` endpoint
- Database issues: Check MongoDB logs (`journalctl -u mongod`)
