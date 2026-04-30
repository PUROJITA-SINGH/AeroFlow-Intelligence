"""baseline existing schema

Revision ID: 20260430_0001
Revises:
Create Date: 2026-04-30

This baseline migration is intentionally non-destructive. It uses
SQLAlchemy's checkfirst behavior so existing Render tables and live data are
left untouched, while fresh databases can still create the current schema.
"""
from typing import Sequence, Union

from alembic import op

from database import Base

revision: str = "20260430_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind, checkfirst=True)


def downgrade() -> None:
    pass
