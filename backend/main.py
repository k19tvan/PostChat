"""
FastAPI backend for fetching Facebook post data using Apify.

This backend receives requests from the Chrome extension, uses the Apify client
to scrape Facebook post data, and returns the results.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from apify_client import ApifyClient
from typing import Optional

# Initialize FastAPI app
app = FastAPI(title="Facebook Post Fetcher API")

# Enable CORS for Chrome extension
# This allows the extension to make requests from chrome-extension:// origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PostRequest(BaseModel):
    """Request model for fetching post information."""
    url: str
    apify_key: str


class PostResponse(BaseModel):
    """Response model containing the post data."""
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "Facebook Post Fetcher API is running"}


@app.post("/get_post_info", response_model=PostResponse)
async def get_post_info(request: PostRequest):
    """
    Fetch Facebook post information using Apify.
    
    Args:
        request: Contains the Facebook post URL and Apify API key
        
    Returns:
        PostResponse with the scraped post data or error message
    """
    try:
        # Initialize Apify client with the provided API key
        client = ApifyClient(request.apify_key)
        
        # Run the Facebook Posts Scraper actor
        print(f"Starting Apify scraper for URL: {request.url}")
        run = client.actor("apify/facebook-posts-scraper").call(
            run_input={
                "startUrls": [{"url": request.url}],
                "resultsLimit": 1,
            }
        )
        
        # Get the dataset from the run
        dataset_id = run["defaultDatasetId"]
        print(f"Dataset ID: {dataset_id}")
        
        # Fetch the first item from the dataset
        items = list(client.dataset(dataset_id).iterate_items())
        print(f"Scraper finished. Items found: {len(items)}")
        
        if not items:
            print("No items found in dataset.")
            raise HTTPException(
                status_code=404,
                detail="No data found for the provided URL"
            )
        
        # Return the first item
        item = items[0]
        print(f"Successfully fetched post data. Content snippet: {str(item.get('text', 'No text'))[:100]}...")
        
        return PostResponse(
            success=True,
            data=item
        )
        
    except Exception as e:
        # Log the error and return it to the client
        error_message = str(e)
        print(f"Error fetching post info: {error_message}")
        
        return PostResponse(
            success=False,
            error=error_message
        )


if __name__ == "__main__":
    import uvicorn
    
    # Run the server
    print("Starting FastAPI server on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
