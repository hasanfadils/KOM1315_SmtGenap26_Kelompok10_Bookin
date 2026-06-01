"""
Pytest fixtures for integration testing.
Provides in-memory SQLite test database and FastAPI test client.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.models import User, UserRole
from app.services.auth_service import AuthService

# ── Test Database (in-memory SQLite) ──

SQLALCHEMY_TEST_URL = "sqlite://"

test_engine = create_engine(
    SQLALCHEMY_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Override the database dependency
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function", autouse=True)
def setup_database():
    """Create fresh tables for each test."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db():
    """Get a test database session."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    """Get a FastAPI test client."""
    return TestClient(app)


@pytest.fixture
def admin_user(db) -> User:
    """Create and return an admin user."""
    user = User(
        name="Test Admin",
        email="admin@test.com",
        password_hash=AuthService.hash_password("admin123"),
        role=UserRole.admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def tendik_user(db) -> User:
    """Create and return a tendik (staff) user."""
    user = User(
        name="Test Tendik",
        email="tendik@test.com",
        password_hash=AuthService.hash_password("tendik123"),
        role=UserRole.staff,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def student_user(db) -> User:
    """Create and return a student user."""
    user = User(
        name="Test Mahasiswa",
        email="student@test.com",
        password_hash=AuthService.hash_password("student123"),
        nim="G6401211001",
        role=UserRole.student,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_token(admin_user) -> str:
    """Get a JWT token for the admin user."""
    return AuthService.create_access_token({"sub": admin_user.id})


@pytest.fixture
def tendik_token(tendik_user) -> str:
    """Get a JWT token for the tendik user."""
    return AuthService.create_access_token({"sub": tendik_user.id})


@pytest.fixture
def student_token(student_user) -> str:
    """Get a JWT token for the student user."""
    return AuthService.create_access_token({"sub": student_user.id})
