"""initial schema

Revision ID: ac5a6d793cbe
Revises:
Create Date: 2026-06-07 17:00:46.237069

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "ac5a6d793cbe"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DROP TABLE IF EXISTS recommendation_sessions CASCADE")
    op.execute("DROP TABLE IF EXISTS votes CASCADE")
    op.execute("DROP TABLE IF EXISTS members CASCADE")
    op.execute("DROP TABLE IF EXISTS groups CASCADE")

    op.create_table(
        "groups",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("group_name", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="open"),
        sa.Column("results", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "members",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("group_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("dietary", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("budget_rm", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_members_group_id"), "members", ["group_id"], unique=False)

    op.create_table(
        "votes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("group_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("restaurant_id", sa.Text(), nullable=False),
        sa.Column("count", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("group_id", "restaurant_id", name="uq_votes_group_restaurant"),
    )
    op.create_index(op.f("ix_votes_group_id"), "votes", ["group_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_votes_group_id"), table_name="votes")
    op.drop_table("votes")
    op.drop_index(op.f("ix_members_group_id"), table_name="members")
    op.drop_table("members")
    op.drop_table("groups")
