import uuid

from sqlalchemy import Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="open")
    results: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    members: Mapped[list["Member"]] = relationship(
        back_populates="group",
        cascade="all, delete-orphan",
        order_by="Member.id",
    )
    votes: Mapped[list["Vote"]] = relationship(
        back_populates="group",
        cascade="all, delete-orphan",
    )
    member_votes: Mapped[list["MemberVote"]] = relationship(
        back_populates="group",
        cascade="all, delete-orphan",
    )


class Member(Base):
    __tablename__ = "members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    group_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    dietary: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    budget_rm: Mapped[float] = mapped_column(Float, nullable=False)

    group: Mapped["Group"] = relationship(back_populates="members")
    member_votes: Mapped[list["MemberVote"]] = relationship(
        back_populates="member",
        cascade="all, delete-orphan",
    )


class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (UniqueConstraint("group_id", "restaurant_id", name="uq_votes_group_restaurant"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    group_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    restaurant_id: Mapped[str] = mapped_column(Text, nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    group: Mapped["Group"] = relationship(back_populates="votes")


class MemberVote(Base):
    __tablename__ = "member_votes"
    __table_args__ = (
        UniqueConstraint("member_id", "restaurant_id", name="uq_member_votes_member_restaurant"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    group_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    member_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
    )
    restaurant_id: Mapped[str] = mapped_column(Text, nullable=False)

    group: Mapped["Group"] = relationship(back_populates="member_votes")
    member: Mapped["Member"] = relationship(back_populates="member_votes")