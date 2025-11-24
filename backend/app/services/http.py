import httpx
from typing import Any


class HTTPService:
    """HTTP service with timeout and retry logic."""
    
    def __init__(self, timeout: int = 30, max_retries: int = 3):
        self.timeout = timeout
        self.max_retries = max_retries
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(timeout),
            follow_redirects=True
        )
    
    async def get(self, url: str, params: dict[str, Any] | None = None, headers: dict[str, str] | None = None) -> dict[str, Any]:
        """Make GET request with retry logic."""
        last_exception = None
        
        for attempt in range(self.max_retries):
            try:
                response = await self.client.get(url, params=params, headers=headers)
                response.raise_for_status()
                return response.json()
            except (httpx.HTTPError, httpx.TimeoutException) as e:
                last_exception = e
                if attempt == self.max_retries - 1:
                    break
                continue
        
        raise last_exception or Exception("Failed to fetch data")
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Global HTTP service instance
http_service = HTTPService()
