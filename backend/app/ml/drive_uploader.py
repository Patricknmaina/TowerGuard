from __future__ import annotations

import csv
import logging
import os
import tempfile
from typing import Dict, Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

log = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/drive.file"]
CLIENT_SECRET_PATH = os.getenv(
    "DRIVE_CLIENT_SECRET_JSON",
    os.path.join("backend", "credentials", "drive_client_secret.json"),
)
TOKEN_PATH = os.getenv(
    "DRIVE_TOKEN_JSON",
    os.path.join("backend", "credentials", "drive_token.json"),
)


def _get_drive_service():
    creds: Optional[Credentials] = None
    if os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CLIENT_SECRET_PATH):
                raise RuntimeError(f"Drive client secret missing: {CLIENT_SECRET_PATH}")
            flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_PATH, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_PATH, "w", encoding="utf-8") as token_file:
            token_file.write(creds.to_json())
    return build("drive", "v3", credentials=creds)


def upload_file_to_drive(local_path: str, drive_folder_id: str, mime_type: str = "text/csv") -> str:
    log.info("Uploading %s to Drive folder %s", local_path, drive_folder_id)
    service = _get_drive_service()
    metadata = {
        "name": os.path.basename(local_path),
        "parents": [drive_folder_id],
    }
    media = MediaFileUpload(local_path, mimetype=mime_type, resumable=True)
    file = (
        service.files()
        .create(body=metadata, media_body=media, fields="id")
        .execute()
    )
    file_id = file.get("id")
    log.info("Uploaded artifact as Drive file %s", file_id)
    return file_id


def maybe_upload_ndvi(site_id: str, ndvi_stats: Dict[str, Optional[float]]) -> Optional[str]:
    if os.getenv("ENABLE_DRIVE_UPLOAD", "false").lower() != "true":
        return None
    folder_id = os.getenv("DRIVE_FOLDER_ID")
    if not folder_id:
        log.debug("Drive upload skipped: DRIVE_FOLDER_ID not set")
        return None

    if not ndvi_stats:
        return None

    tmp_dir = tempfile.gettempdir()
    artifact_path = os.path.join(tmp_dir, f"ndvi_{site_id}.csv")
    with open(artifact_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=list(ndvi_stats.keys()))
        writer.writeheader()
        writer.writerow({k: v if v is not None else "" for k, v in ndvi_stats.items()})

    try:
        return upload_file_to_drive(artifact_path, folder_id)
    except Exception as exc:
        log.exception("Drive upload failed: %s", exc)
        return None
