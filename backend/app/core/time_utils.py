from datetime import UTC, datetime


def utc_now() -> datetime:
    # Keep DB values naive UTC for backward compatibility with existing DateTime columns.
    return datetime.now(UTC).replace(tzinfo=None)


def utc_now_iso_z() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
