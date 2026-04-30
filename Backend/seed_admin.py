import os
import sys

from passlib.context import CryptContext
from sqlalchemy.exc import SQLAlchemyError

from database import SessionLocal, User


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def require_password(env_name: str) -> str:
    password = os.environ.get(env_name)
    if not password:
        raise ValueError(f"{env_name} is required")
    if len(password) < 12:
        raise ValueError(f"{env_name} must be at least 12 characters")
    return password


def create_user_if_missing(db, username: str, role: str, password: str) -> str:
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        return f"Skipped existing user: {username} ({existing.role})"

    user = User(
        username=username,
        hashed_password=pwd_context.hash(password),
        role=role,
    )
    db.add(user)
    return f"Created user: {username} ({role})"


def main() -> int:
    if not os.environ.get("DATABASE_URL"):
        print("DATABASE_URL is required", file=sys.stderr)
        return 1

    try:
        users_to_seed = [
            ("admin", "admin", require_password("ADMIN_PASSWORD")),
            ("sensor_operator", "operations", require_password("OPERATIONS_PASSWORD")),
            ("viewer", "viewer", require_password("VIEWER_PASSWORD")),
        ]
    except ValueError as exc:
        print(f"Seed configuration error: {exc}", file=sys.stderr)
        return 1

    db = SessionLocal()
    try:
        messages = [
            create_user_if_missing(db, username, role, password)
            for username, role, password in users_to_seed
        ]
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        print(f"Database seed failed: {exc}", file=sys.stderr)
        return 1
    finally:
        db.close()

    for message in messages:
        print(message)
    print("User seed completed successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
