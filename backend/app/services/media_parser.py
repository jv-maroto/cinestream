import re
from pathlib import Path
from typing import Dict, Optional, Tuple
from guessit import guessit


class MediaParser:
    """Parse media filenames to extract title, year, season, episode info"""

    # Common abbreviations for series/anime titles
    TITLE_ABBREVIATIONS = {
        'bns': 'Bones',
        'got': 'Game of Thrones',
        'bb': 'Breaking Bad',
        'bcs': 'Better Call Saul',
        'twd': 'The Walking Dead',
        'himym': 'How I Met Your Mother',
        'tbbt': 'The Big Bang Theory',
        'aot': 'Attack on Titan',
        'snk': 'Shingeki no Kyojin',
        'fma': 'Fullmetal Alchemist',
        'fmab': 'Fullmetal Alchemist Brotherhood',
        'mha': 'My Hero Academia',
        'bnha': 'Boku no Hero Academia',
        'op': 'One Piece',
        'db': 'Dragon Ball',
        'dbz': 'Dragon Ball Z',
        'dbs': 'Dragon Ball Super',
        'dn': 'Death Note',
        'hxh': 'Hunter x Hunter',
        'jjk': 'Jujutsu Kaisen',
        'csm': 'Chainsaw Man',
        'sao': 'Sword Art Online',
        'tg': 'Tokyo Ghoul',
        'cb': 'Cowboy Bebop',
        'eva': 'Neon Genesis Evangelion',
        'opm': 'One Punch Man',
        'mp100': 'Mob Psycho 100',
        'kny': 'Kimetsu no Yaiba',
        'ds': 'Demon Slayer',
        're': 'Re:Zero',
        'sxf': 'Spy x Family',
        'vs': 'Vinland Saga',
        'cg': 'Code Geass',
        'ttgl': 'Tengen Toppa Gurren Lagann',
        'klk': 'Kill la Kill',
    }

    # Language indicators in filenames
    LANGUAGE_INDICATORS = {
        'latino': 'es-LA',
        'lat': 'es-LA',
        'spanish latin': 'es-LA',
        'español latino': 'es-LA',
        'castellano': 'es-ES',
        'spanish': 'es-ES',
        'español': 'es-ES',
        'esp': 'es-ES',
        'english': 'en',
        'eng': 'en',
        'ingles': 'en',
        'dual': 'dual',
        'multi': 'multi',
        'japanese': 'ja',
        'jap': 'ja',
        'japones': 'ja',
        'french': 'fr',
        'frances': 'fr',
        'german': 'de',
        'aleman': 'de',
        'italian': 'it',
        'italiano': 'it',
        'portuguese': 'pt',
        'portugues': 'pt',
        'sub': 'subtitled',
        'subs': 'subtitled',
        'subbed': 'subtitled',
        'dub': 'dubbed',
        'dubbed': 'dubbed',
        'v.o': 'original',
        'vo': 'original',
        'vose': 'es-sub',
    }

    @staticmethod
    def expand_abbreviation(title: str) -> str:
        """Expand known abbreviations to full titles"""
        if not title:
            return title

        # Check if the base title (before episode numbers) is an abbreviation
        # Pattern: Abbreviation-TxxExx or Abbreviation TxxExx
        match = re.match(r'^([a-zA-Z]+)[-_\s]?[Tt]?\d', title)
        if match:
            abbrev = match.group(1).lower()
            if abbrev in MediaParser.TITLE_ABBREVIATIONS:
                return title.replace(match.group(1), MediaParser.TITLE_ABBREVIATIONS[abbrev], 1)

        # Also check if the whole title is an abbreviation
        title_lower = title.lower().strip()
        if title_lower in MediaParser.TITLE_ABBREVIATIONS:
            return MediaParser.TITLE_ABBREVIATIONS[title_lower]

        return title

    @staticmethod
    def detect_language(filename: str, filepath: str = "") -> Optional[str]:
        """Detect audio/subtitle language from filename or path"""
        text = f"{filename} {filepath}".lower()

        for indicator, lang_code in MediaParser.LANGUAGE_INDICATORS.items():
            # Use word boundaries to avoid false matches
            if re.search(rf'\b{re.escape(indicator)}\b', text):
                return lang_code

        return None

    @staticmethod
    def parse_filename(filename: str, filepath: str = "") -> Dict:
        """
        Parse filename using guessit library
        Returns dict with: title, year, season, episode, type, etc.
        """
        try:
            result = guessit(filename)

            # Get the title and try to expand abbreviations
            title = result.get("title")
            if title:
                title = MediaParser.expand_abbreviation(title)

            # Detect language from filename
            detected_lang = MediaParser.detect_language(filename, filepath)

            return {
                "title": title,
                "year": result.get("year"),
                "season": result.get("season"),
                "episode": result.get("episode"),
                "episode_title": result.get("episode_title"),
                "type": str(result.get("type", "movie")),
                "resolution": result.get("screen_size"),
                "source": result.get("source"),
                "codec": result.get("video_codec"),
                "audio_codec": result.get("audio_codec"),
                "release_group": result.get("release_group"),
                "detected_language": detected_lang,
            }
        except Exception as e:
            print(f"Error parsing filename: {e}")
            return {"title": Path(filename).stem}

    @staticmethod
    def parse_with_folder_context(filepath: str, filename: str) -> Dict:
        """
        Parse using both filename and folder context for better accuracy
        """
        # First parse the filename with filepath for language detection
        parsed = MediaParser.parse_filename(filename, filepath)

        # Get folder information
        path_parts = Path(filepath).parts

        # Try to extract additional info from folders
        for i, part in enumerate(path_parts):
            part_lower = part.lower()

            # Skip drive letters, common root folders
            if len(part) <= 3 or part_lower in ['media', 'videos', 'd:', 'peliculas', 'movies', 'series', 'anime', 'documentales']:
                continue

            # If we don't have a title, try to get it from folder
            if not parsed.get("title"):
                # Try parsing the folder name
                folder_parsed = MediaParser.parse_filename(part)
                if folder_parsed.get("title"):
                    parsed["title"] = folder_parsed["title"]
                    if folder_parsed.get("year") and not parsed.get("year"):
                        parsed["year"] = folder_parsed["year"]

            # Check for year in folder name if we don't have one
            if not parsed.get("year"):
                year_match = re.search(r'\((\d{4})\)|\b(19|20)\d{2}\b', part)
                if year_match:
                    year_str = year_match.group(1) or year_match.group(0)
                    try:
                        parsed["year"] = int(year_str)
                    except ValueError:
                        pass

        return parsed

    @staticmethod
    def clean_title(title: str) -> str:
        """Clean title for search"""
        if not title:
            return ""

        # Remove common patterns
        patterns = [
            r'\[.*?\]',  # [anything]
            r'\(.*?\)',  # (anything)
            r'\{.*?\}',  # {anything}
            r'^\d{4}\s*-?\s*',  # year at start
            r'\s*-?\s*\d{4}$',  # year at end
            r'\s+(720p|1080p|2160p|4k|hdr|bluray|webrip|hdtv|dvdrip)',
            r'\s+(x264|x265|h264|h265|hevc|aac|ac3|dts)',
            r'\s+-\s*$',  # trailing dash
        ]

        cleaned = title
        for pattern in patterns:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)

        # Replace dots and underscores with spaces
        cleaned = re.sub(r'[._]', ' ', cleaned)

        # Remove extra whitespace
        cleaned = ' '.join(cleaned.split())

        return cleaned.strip()

    # Anime indicators for detection
    ANIME_INDICATORS = [
        'anime', 'アニメ', 'ova', 'ona', 'fansub', 'horriblesubs', 'subsplease',
        'erai-raws', 'judas', 'commie', 'nyaa', 'mal-id', '[bd]', '[dvd]',
        'crunchyroll', 'funimation', 'animeflv', 'animepahe', 'gogoanime'
    ]

    ANIME_STUDIOS = [
        'toei', 'madhouse', 'bones', 'mappa', 'ufotable', 'wit studio',
        'kyoto animation', 'a-1 pictures', 'cloverworks', 'trigger',
        'gainax', 'sunrise', 'pierrot', 'ghibli', 'jc staff'
    ]

    # Known anime titles for better detection
    KNOWN_ANIME = [
        'cowboy bebop', 'naruto', 'one piece', 'dragon ball', 'bleach', 'death note',
        'attack on titan', 'shingeki no kyojin', 'fullmetal alchemist', 'my hero academia',
        'boku no hero', 'demon slayer', 'kimetsu no yaiba', 'jujutsu kaisen', 'chainsaw man',
        'spy x family', 'vinland saga', 'mob psycho', 'one punch man', 'hunter x hunter',
        'evangelion', 'steins gate', 'code geass', 'gurren lagann', 'kill la kill',
        'sword art online', 'tokyo ghoul', 'parasyte', 'erased', 'your lie in april',
        'violet evergarden', 'made in abyss', 'promised neverland', 're:zero', 'konosuba'
    ]

    # Opening/Ending indicators
    OPENING_INDICATORS = [
        'opening', ' op ', ' op.', '-op-', '_op_', ' op1', ' op2', ' op3',
        'ending', ' ed ', ' ed.', '-ed-', '_ed_', ' ed1', ' ed2', ' ed3',
        'ost', 'soundtrack', 'theme song', 'intro', 'credits',
        'ncop', 'nced', 'creditless'
    ]

    @staticmethod
    def extract_series_name_from_opening(filename: str, filepath: str = "") -> Optional[str]:
        """Extract the series/anime name from an opening/ending filename"""
        # Pattern: "Title Opening 1" or "Title - OP1" etc.
        patterns = [
            r'^(.+?)\s*[-_]\s*(?:opening|op|ending|ed)\s*\d*',
            r'^(.+?)\s+(?:opening|op|ending|ed)\s*\d*',
            r'\[.*?\]\s*(.+?)\s*[-_]\s*(?:opening|op|ending|ed)',
        ]

        text = filename.lower()
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                title = match.group(1).strip()
                # Clean up the title
                title = re.sub(r'[\[\]\(\)]', '', title).strip()
                title = re.sub(r'\s+', ' ', title)
                if len(title) > 2:
                    return title

        return None

    @staticmethod
    def detect_media_type(parsed: Dict, path: str) -> str:
        """Detect if media is movie, series, anime, opening, or episode"""
        path_lower = path.lower()
        title_lower = (parsed.get("title") or "").lower()
        filename_lower = Path(path).name.lower()

        # Check for opening/ending first (usually short videos)
        for indicator in MediaParser.OPENING_INDICATORS:
            if indicator in filename_lower or indicator in title_lower:
                return "opening"

        # Check for anime indicators first
        is_anime = False

        # Check path and title for anime indicators
        for indicator in MediaParser.ANIME_INDICATORS:
            if indicator in path_lower or indicator in title_lower:
                is_anime = True
                break

        # Check for anime studios in path
        if not is_anime:
            for studio in MediaParser.ANIME_STUDIOS:
                if studio in path_lower:
                    is_anime = True
                    break

        # Check for common anime naming patterns like [Group] Title - 01 [720p]
        anime_pattern = r'\[.*?\].*?-\s*\d+\s*[\[\(]'
        if re.search(anime_pattern, path):
            is_anime = True

        # Check for anime folder structure
        anime_folders = ['anime', 'animes', 'アニメ', 'animation', 'animacion']
        if any(folder in path_lower for folder in anime_folders):
            is_anime = True

        # Check for known anime titles
        if not is_anime:
            for anime_title in MediaParser.KNOWN_ANIME:
                if anime_title in path_lower or anime_title in title_lower:
                    is_anime = True
                    break

        # Determine specific type
        if is_anime:
            if parsed.get("type") == "episode" or parsed.get("season") or parsed.get("episode"):
                return "anime_series"
            # Check if it's a movie (usually longer files, specific naming)
            if "movie" in path_lower or "película" in path_lower or "pelicula" in path_lower:
                return "anime_movie"
            # Default anime to series if has episode-like naming
            if parsed.get("episode") or re.search(r'[-_\s]\d{1,3}(?:[vV]\d)?[\[\s\.]', path):
                return "anime_series"
            return "anime"

        # Check guessit type for regular media
        if parsed.get("type") == "episode" or parsed.get("season") or parsed.get("episode"):
            return "episode"

        # Check path for series indicators
        series_indicators = ['season', 'temporada', 'series', 'serie', 's01', 's02', 's03', 's04', 's05']
        if any(ind in path_lower for ind in series_indicators):
            if parsed.get("season") or parsed.get("episode"):
                return "episode"
            return "series"

        # Check for documentary indicators
        doc_indicators = ['documentary', 'documental', 'national geographic', 'discovery', 'bbc earth']
        if any(ind in path_lower for ind in doc_indicators):
            return "documentary"

        # Default to movie
        return "movie"

    @staticmethod
    def extract_series_info(path: str, filename: str) -> Tuple[Optional[str], Optional[int], Optional[int]]:
        """
        Extract series name, season, and episode from path and filename
        Returns: (series_name, season_number, episode_number)
        """
        parsed = MediaParser.parse_filename(filename)

        # Try to get series name from parent directory
        path_parts = Path(path).parts
        series_name = None

        # Look for series name in path
        for i, part in enumerate(path_parts):
            # Skip common folder names
            if part.lower() in ['media', 'series', 'tv', 'shows', 'videos']:
                continue

            # Check if this looks like a season folder
            if re.match(r'^(season|temporada|s)\s*\d+', part, re.IGNORECASE):
                # Series name is likely the previous folder
                if i > 0:
                    series_name = path_parts[i - 1]
                break

            # Otherwise, this might be the series name
            series_name = part

        # Get season and episode from parsed filename
        season = parsed.get("season")
        episode = parsed.get("episode")

        return series_name, season, episode
