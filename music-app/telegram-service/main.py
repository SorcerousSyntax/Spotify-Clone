"""
Telegram Music Fetcher Microservice
FastAPI + Pyrogram — fetches songs from Telegram bots with fallback chain
"""

import os
import base64
import asyncio
import logging
import re
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Telegram Music Fetcher", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pyrogram Client ───────────────────────────────────────────────

from pyrogram import Client, filters
from pyrogram.errors import FloodWait

API_ID = os.getenv("TELEGRAM_API_ID")
API_HASH = os.getenv("TELEGRAM_API_HASH")
PHONE = os.getenv("TELEGRAM_PHONE")

tg_client: Optional[Client] = None

DOWNLOAD_DIR = Path("./downloads")
DOWNLOAD_DIR.mkdir(exist_ok=True)

# ─── Bot Configuration ─────────────────────────────────────────────

MUSIC_BOTS = [
    {"username": "MusicsHuntersbot", "timeout": 20, "label": "Hindi/Punjabi/English"},
    {"username": "SMLoadBot", "timeout": 20, "label": "Bollywood fallback"},
    {"username": "DeezerMusicBot", "timeout": 20, "label": "English/Mainstream"},
]
YOUTUBE_BOT = {"username": "YtDlBot", "timeout": 40, "label": "YouTube (all Haryanvi)"}


# ─── Request / Response Models ─────────────────────────────────────

class FetchRequest(BaseModel):
    query: str


class FetchResponse(BaseModel):
    audio: Optional[str] = None  # base64 encoded
    title: Optional[str] = None
    artist: Optional[str] = None
    album_art: Optional[str] = None  # base64 encoded
    duration: Optional[int] = None
    source_bot: str
    choices: Optional[list[str]] = None


# ─── YouTube Search ─────────────────────────────────────────────────

async def search_youtube(query: str) -> Optional[str]:
    """Search YouTube and return the top result URL."""
    try:
        from youtubesearchpython import VideosSearch
        search = VideosSearch(f"{query} official song", limit=1)
        results = search.result()
        if results and results.get("result"):
            url = results["result"][0]["link"]
            logger.info(f"YouTube result: {url}")
            return url
    except Exception as e:
        logger.error(f"YouTube search error: {e}")
    return None


# ─── Telegram Bot Interaction ───────────────────────────────────────

async def try_telegram_bot(
    bot_username: str,
    message: str,
    timeout: int = 20,
) -> Optional[dict]:
    """
    Send a message to a Telegram bot and wait for an audio file response.
    Returns dict with audio data or None on failure.
    """
    global tg_client
    if not tg_client:
        return None

    try:
        logger.info(f"Trying @{bot_username} with: '{message[:50]}...'")

        # Send the query to the bot
        sent_query = await tg_client.send_message(bot_username, message)

        # Wait for audio response
        audio_data = None
        start_time = asyncio.get_event_loop().time()

        while asyncio.get_event_loop().time() - start_time < timeout:
            await asyncio.sleep(2)

            # Get recent messages from the bot
            async for msg in tg_client.get_chat_history(bot_username, limit=8):
                # Ignore messages older than our query to avoid stale results.
                if msg.id <= sent_query.id:
                    continue

                # If bot provides multiple options, return all options so frontend can show them.
                if msg.reply_markup and hasattr(msg.reply_markup, "inline_keyboard"):
                    keyboard = msg.reply_markup.inline_keyboard or []
                    choices = []
                    seen = set()
                    for row in keyboard:
                        for btn in row:
                            text = (getattr(btn, "text", "") or "").strip()
                            if not text:
                                continue
                            if re.search(r"(next|prev|back|menu|tracks|albums|artists)", text, re.IGNORECASE):
                                continue
                            if any(sym in text for sym in ["➡", "⬅", "✅", "☑", "🔙", "↩"]):
                                continue
                            if len(text) < 4:
                                continue
                            if text in seen:
                                continue
                            seen.add(text)
                            choices.append(text)

                    if choices:
                        logger.info(f"↳ @{bot_username} returned {len(choices)} choices")
                        return {
                            "choices": choices[:10],
                            "source_bot": f"@{bot_username}",
                            "title": message,
                            "artist": "",
                            "duration": 0,
                        }

                # Check if it's an audio file sent after our query
                if msg.audio or msg.document:
                    media = msg.audio or msg.document

                    # Only process audio files
                    mime = getattr(media, "mime_type", "") or ""
                    if not (
                        "audio" in mime
                        or mime == "application/octet-stream"
                        or (hasattr(media, "file_name") and media.file_name and media.file_name.endswith(".mp3"))
                    ):
                        continue

                    # Download the file
                    file_path = await tg_client.download_media(
                        msg,
                        file_name=str(DOWNLOAD_DIR / f"temp_{bot_username}.mp3"),
                    )

                    if file_path and os.path.exists(file_path):
                        with open(file_path, "rb") as f:
                            audio_bytes = f.read()

                        # Extract metadata
                        title = getattr(media, "title", "") or message
                        artist = getattr(media, "performer", "") or "Unknown Artist"
                        duration = getattr(media, "duration", 0) or 0

                        # Get album art (thumbnail)
                        album_art_b64 = None
                        if hasattr(msg, "photo") and msg.photo:
                            art_path = await tg_client.download_media(
                                msg.photo,
                                file_name=str(DOWNLOAD_DIR / f"art_{bot_username}.jpg"),
                            )
                            if art_path and os.path.exists(art_path):
                                with open(art_path, "rb") as af:
                                    album_art_b64 = base64.b64encode(af.read()).decode()
                                os.remove(art_path)

                        # Clean up
                        os.remove(file_path)

                        audio_data = {
                            "audio": base64.b64encode(audio_bytes).decode(),
                            "title": title,
                            "artist": artist,
                            "album_art": album_art_b64,
                            "duration": duration,
                            "source_bot": f"@{bot_username}",
                        }
                        break

                if audio_data:
                    break

            if audio_data:
                break

        if audio_data:
            logger.info(f"✓ @{bot_username} returned: '{audio_data['title']}'")
        else:
            logger.info(f"✗ @{bot_username} timed out or no audio received")

        return audio_data

    except FloodWait as e:
        logger.warning(f"FloodWait from @{bot_username}: {e.value}s")
        await asyncio.sleep(min(e.value, 10))
        return None
    except Exception as e:
        logger.error(f"Error with @{bot_username}: {e}")
        return None


# ─── Main Fetch Function ───────────────────────────────────────────

async def fetch_song(query: str) -> Optional[dict]:
    """
    Fetch a song using the fallback chain:
    1. Try each Telegram music bot
    2. Ultimate fallback: YouTube search → @YtDlBot
    """

    # Try each music bot in order
    for bot in MUSIC_BOTS:
        result = await try_telegram_bot(
            bot["username"],
            query,
            timeout=bot["timeout"],
        )
        if result:
            return result

    # Ultimate fallback: YouTube → @YtDlBot
    logger.info(f"All bots failed, trying YouTube fallback for: '{query}'")
    youtube_url = await search_youtube(query)

    if youtube_url:
        result = await try_telegram_bot(
            YOUTUBE_BOT["username"],
            youtube_url,
            timeout=YOUTUBE_BOT["timeout"],
        )
        if result:
            # Override title with original query since YtDlBot might not have metadata
            if result["title"] == youtube_url:
                result["title"] = query
            return result

    logger.warning(f"✗ Song not found anywhere: '{query}'")
    return None


# ─── API Endpoints ──────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    global tg_client

    if API_ID and API_HASH:
        try:
            tg_client = Client(
                "music_fetcher",
                api_id=int(API_ID),
                api_hash=API_HASH,
                phone_number=PHONE,
            )
            await tg_client.start()
            me = await tg_client.get_me()
            logger.info(f"✓ Telegram client started as: {me.first_name} ({me.phone_number})")
        except Exception as e:
            logger.error(f"✗ Failed to start Telegram client: {e}")
            tg_client = None
    else:
        logger.warning("⚠ Telegram credentials not set — bot fetching disabled")


@app.on_event("shutdown")
async def shutdown():
    global tg_client
    if tg_client:
        await tg_client.stop()
        logger.info("Telegram client stopped")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "telegram_connected": tg_client is not None and tg_client.is_connected,
    }


@app.post("/fetch", response_model=FetchResponse)
async def fetch_endpoint(request: FetchRequest):
    if not tg_client or not tg_client.is_connected:
        raise HTTPException(
            status_code=503,
            detail="Telegram client not connected",
        )

    query = request.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Empty query")

    logger.info(f"🔍 Fetching: '{query}'")
    result = await fetch_song(query)

    if not result:
        raise HTTPException(status_code=404, detail="Song not found")

    return FetchResponse(**result)


# ─── Run ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
