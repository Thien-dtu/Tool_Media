import json
import sqlite3
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DATA_DIR / "tool_media.db"

def load_saved_images(conn: sqlite3.Connection) -> None:
    file_path = DATA_DIR / "saved_images.json"
    if not file_path.exists():
        return
    with file_path.open() as f:
        images = json.load(f)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS saved_images (
            username TEXT,
            id TEXT PRIMARY KEY
        )
        """
    )
    conn.executemany(
        "INSERT OR REPLACE INTO saved_images(username, id) VALUES (?, ?)",
        [(item.get("username"), item.get("id")) for item in images],
    )

def load_last_cursors(conn: sqlite3.Connection) -> None:
    file_path = DATA_DIR / "last_cursors.json"
    if not file_path.exists():
        return
    try:
        with file_path.open() as f:
            data = json.load(f)
    except json.JSONDecodeError as exc:
        print(f"Skipping {file_path}: {exc}")
        return
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS last_cursors (
            apiName TEXT,
            username TEXT,
            cursor TEXT,
            pagesLoaded INTEGER,
            PRIMARY KEY (apiName, username)
        )
        """
    )
    rows = []
    for api_name, users in data.items():
        for username, info in users.items():
            rows.append(
                (
                    api_name,
                    username,
                    info.get("cursor"),
                    info.get("pagesLoaded"),
                )
            )
    conn.executemany(
        "INSERT OR REPLACE INTO last_cursors(apiName, username, cursor, pagesLoaded) VALUES (?,?,?,?)",
        rows,
    )

def load_ig_user_stories_report(conn: sqlite3.Connection) -> None:
    file_path = DATA_DIR / "ig_user_stories_report.jsonl"
    if not file_path.exists():
        return
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS ig_user_stories_report (
            apiName TEXT,
            url TEXT,
            username TEXT,
            total INTEGER,
            have INTEGER,
            nohave INTEGER,
            time TEXT,
            pages INTEGER,
            timestamp TEXT
        )
        """
    )
    rows = []
    content = file_path.read_text()
    # Some lines may have been concatenated without newlines
    content = content.replace('}{', '}\n{')
    for line in content.splitlines():
        line = line.strip()
        if not line:
            continue
        obj = json.loads(line)
        api = obj.get("apiName")
        timestamp = obj.get("timestamp")
        for entry in obj.get("report", []):
            rows.append(
                (
                    api,
                    entry.get("url"),
                    entry.get("username"),
                    entry.get("total"),
                    entry.get("have"),
                    entry.get("nohave"),
                    entry.get("time"),
                    entry.get("pages"),
                    timestamp,
                )
            )
    conn.executemany(
        """
        INSERT OR REPLACE INTO ig_user_stories_report
        (apiName, url, username, total, have, nohave, time, pages, timestamp)
        VALUES (?,?,?,?,?,?,?,?,?)
        """,
        rows,
    )

def main() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        load_saved_images(conn)
        load_last_cursors(conn)
        load_ig_user_stories_report(conn)
        conn.commit()
    finally:
        conn.close()
    print(f"Database written to {DB_PATH}")

if __name__ == "__main__":
    main()
