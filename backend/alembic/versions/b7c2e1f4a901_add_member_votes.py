"""add member votes

Revision ID: b7c2e1f4a901
Revises: ac5a6d793cbe
Create Date: 2026-06-11 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "b7c2e1f4a901"
down_revision: Union[str, Sequence[str], None] = "ac5a6d793cbe"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "member_votes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("group_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("member_id", sa.Integer(), nullable=False),
        sa.Column("restaurant_id", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["member_id"], ["members.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("member_id", "restaurant_id", name="uq_member_votes_member_restaurant"),
    )
    op.create_index(op.f("ix_member_votes_group_id"), "member_votes", ["group_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_member_votes_group_id"), table_name="member_votes")
    op.drop_table("member_votes")