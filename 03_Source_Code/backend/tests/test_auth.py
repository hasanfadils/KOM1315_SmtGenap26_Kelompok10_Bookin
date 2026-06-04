"""Tests for the authentication endpoints."""


class TestRegister:
    def test_register_success(self, client):
        response = client.post(
            "/auth/register",
            json={
                "name": "New Student",
                "email": "new@ipb.ac.id",
                "password": "password123",
                "nim": "G6401211099",
                "role": "student",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "new@ipb.ac.id"
        assert data["user"]["role"] == "student"

    def test_register_duplicate_email(self, client, student_user):
        response = client.post(
            "/auth/register",
            json={
                "name": "Duplicate",
                "email": "student@test.com",  # already exists
                "password": "password123",
            },
        )
        assert response.status_code == 400
        assert "sudah terdaftar" in response.json()["detail"]


class TestLogin:
    def test_login_success(self, client, student_user):
        response = client.post(
            "/auth/login",
            json={
                "email": "student@test.com",
                "password": "student123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "student@test.com"

    def test_login_wrong_password(self, client, student_user):
        response = client.post(
            "/auth/login",
            json={
                "email": "student@test.com",
                "password": "wrongpassword",
            },
        )
        assert response.status_code == 401

    def test_login_nonexistent_email(self, client):
        response = client.post(
            "/auth/login",
            json={
                "email": "nonexistent@test.com",
                "password": "password123",
            },
        )
        assert response.status_code == 401


class TestGetMe:
    def test_get_me_success(self, client, student_token):
        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert response.status_code == 200
        assert response.json()["email"] == "student@test.com"

    def test_get_me_no_token(self, client):
        response = client.get("/auth/me")
        assert response.status_code in [401, 403]  # HTTPBearer returns 401 or 403 when no credentials
