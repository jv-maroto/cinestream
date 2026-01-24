import httpx
from typing import Optional, Dict, List, Any
from ..config import settings


class TMDBClient:
    """Client for The Movie Database API"""

    def __init__(self):
        self.api_key = settings.TMDB_API_KEY
        self.base_url = settings.TMDB_BASE_URL
        self.image_base = settings.TMDB_IMAGE_BASE

    def _make_request(self, endpoint: str, params: Dict = None) -> Optional[Dict]:
        """Make request to TMDB API"""
        if not self.api_key:
            print("TMDB API key not configured")
            return None

        url = f"{self.base_url}{endpoint}"
        default_params = {
            "api_key": self.api_key,
            "language": "es-ES"
        }
        if params:
            default_params.update(params)

        try:
            response = httpx.get(url, params=default_params, timeout=10.0)
            if response.status_code == 200:
                return response.json()
            print(f"TMDB API error: {response.status_code}")
            return None
        except Exception as e:
            print(f"TMDB request error: {e}")
            return None

    def search_movie(self, query: str, year: Optional[int] = None) -> List[Dict]:
        """Search for movies by title"""
        params = {"query": query}
        if year:
            params["year"] = year

        result = self._make_request("/search/movie", params)
        return result.get("results", []) if result else []

    def search_tv(self, query: str, year: Optional[int] = None) -> List[Dict]:
        """Search for TV series by title"""
        params = {"query": query}
        if year:
            params["first_air_date_year"] = year

        result = self._make_request("/search/tv", params)
        return result.get("results", []) if result else []

    def get_movie_details(self, tmdb_id: int) -> Optional[Dict]:
        """Get movie details including credits"""
        result = self._make_request(f"/movie/{tmdb_id}", {"append_to_response": "credits"})
        return result

    def get_tv_details(self, tmdb_id: int) -> Optional[Dict]:
        """Get TV series details including credits"""
        result = self._make_request(f"/tv/{tmdb_id}", {"append_to_response": "credits"})
        return result

    def get_tv_episode(self, tv_id: int, season: int, episode: int) -> Optional[Dict]:
        """Get TV episode details"""
        result = self._make_request(f"/tv/{tv_id}/season/{season}/episode/{episode}")
        return result

    def get_person_details(self, person_id: int) -> Optional[Dict]:
        """Get person (actor/director) details"""
        result = self._make_request(f"/person/{person_id}")
        return result

    def get_collection_details(self, collection_id: int) -> Optional[Dict]:
        """Get collection details"""
        result = self._make_request(f"/collection/{collection_id}")
        return result

    def get_poster_url(self, path: str, size: str = "w500") -> Optional[str]:
        """Get full poster URL"""
        if not path:
            return None
        return f"{self.image_base}/{size}{path}"

    def get_backdrop_url(self, path: str, size: str = "w1280") -> Optional[str]:
        """Get full backdrop URL"""
        if not path:
            return None
        return f"{self.image_base}/{size}{path}"

    def get_profile_url(self, path: str, size: str = "w185") -> Optional[str]:
        """Get full profile image URL"""
        if not path:
            return None
        return f"{self.image_base}/{size}{path}"


# Singleton instance
tmdb_client = TMDBClient()
