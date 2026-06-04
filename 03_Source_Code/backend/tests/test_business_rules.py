"""Tests for critical business rules in the TLS IPB booking system."""

import pytest
from datetime import datetime, timedelta, timezone

from app.models import Ruangan, RuanganType, RuanganStatus, Pengajuan, User, UserRole
from app.models.enums import PengajuanStatus
from app.services.auth_service import AuthService


@pytest.fixture
def room(db) -> Ruangan:
    r = Ruangan(
        name="Lab Komputasi",
        type=RuanganType.LABORATORY,
        status=RuanganStatus.AVAILABLE,
        capacity=40,
        location="FMIPA",
        description="Lab komputer",
        image_url="http://placehold.co/400",
        features=["PC", "Projector"],
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


class TestRegistrationSecurity:
    def test_register_defaults_to_student(self, client):
        """Public registration must always create student accounts."""
        response = client.post("/auth/register", json={
            "name": "Attacker",
            "email": "attacker@evil.com",
            "password": "password123",
        })
        assert response.status_code == 201
        assert response.json()["user"]["role"] == "student"

    def test_register_ignores_role_field(self, client):
        """Even if 'role' is sent, it should be ignored/forced to student."""
        response = client.post("/auth/register", json={
            "name": "Attacker",
            "email": "attacker2@evil.com",
            "password": "password123",
            "role": "admin",
        })
        assert response.status_code == 201
        assert response.json()["user"]["role"] == "student"

    def test_register_short_password_rejected(self, client):
        """Password must be at least 6 characters."""
        response = client.post("/auth/register", json={
            "name": "User",
            "email": "short@pw.com",
            "password": "12",
        })
        assert response.status_code == 422

    def test_register_duplicate_email(self, client):
        """Duplicate email should be rejected."""
        payload = {
            "name": "User A",
            "email": "same@email.com",
            "password": "password123",
        }
        client.post("/auth/register", json=payload)
        response = client.post("/auth/register", json=payload)
        assert response.status_code == 400


class TestApprovalFlow:
    def _submit_booking(self, client, student_token, room_id, day_offset=3):
        """Helper: Submit a booking via the API."""
        future = datetime.now() + timedelta(days=day_offset)
        date_str = future.strftime("%Y-%m-%d")
        return client.post(
            "/pengajuan",
            data={
                "ruangan_id": room_id,
                "event_name": "Test Event",
                "event_description": "Test description",
                "date": date_str,
                "start_time": "09:00",
                "end_time": "11:00",
                "attendees": "20",
            },
            headers={"Authorization": f"Bearer {student_token}"},
        )

    def test_full_approval_flow(self, client, student_token, tendik_token, admin_token, room):
        """Test: Submit → Verify (Tendik) → Approve (Admin)."""
        # Submit
        r = self._submit_booking(client, student_token, room.id)
        assert r.status_code == 201
        pid = r.json()["id"]
        assert r.json()["status"] == PengajuanStatus.MENUNGGU_VERIFIKASI.value

        # Verify
        r = client.put(f"/pengajuan/{pid}/verify",
                       headers={"Authorization": f"Bearer {tendik_token}"})
        assert r.status_code == 200
        assert r.json()["status"] == PengajuanStatus.DIVERIFIKASI_TENDIK.value

        # Approve
        r = client.put(f"/pengajuan/{pid}/approve",
                       headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert r.json()["status"] == PengajuanStatus.DISETUJUI.value

    def test_student_cannot_verify(self, client, student_token, room):
        """Students should not be able to verify bookings."""
        r = self._submit_booking(client, student_token, room.id)
        pid = r.json()["id"]

        r = client.put(f"/pengajuan/{pid}/verify",
                       headers={"Authorization": f"Bearer {student_token}"})
        assert r.status_code == 403

    def test_student_cannot_approve(self, client, student_token, tendik_token, room):
        """Students should not be able to approve bookings."""
        r = self._submit_booking(client, student_token, room.id)
        pid = r.json()["id"]

        # Verify first
        client.put(f"/pengajuan/{pid}/verify",
                   headers={"Authorization": f"Bearer {tendik_token}"})

        # Student tries to approve
        r = client.put(f"/pengajuan/{pid}/approve",
                       headers={"Authorization": f"Bearer {student_token}"})
        assert r.status_code == 403

    def test_cannot_approve_without_verification(self, client, student_token, admin_token, room):
        """Admin cannot approve a booking that hasn't been verified by Tendik."""
        r = self._submit_booking(client, student_token, room.id)
        pid = r.json()["id"]

        r = client.put(f"/pengajuan/{pid}/approve",
                       headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 400

    def test_reject_with_reason(self, client, student_token, tendik_token, room):
        """Tendik can reject with a reason."""
        r = self._submit_booking(client, student_token, room.id)
        pid = r.json()["id"]

        r = client.put(
            f"/pengajuan/{pid}/reject",
            json={"reason": "Dokumen tidak lengkap"},
            headers={"Authorization": f"Bearer {tendik_token}"},
        )
        assert r.status_code == 200
        assert r.json()["status"] == PengajuanStatus.DITOLAK.value
        assert r.json()["rejection_reason"] == "Dokumen tidak lengkap"


class TestConflictDetection:
    def test_double_booking_rejected(self, client, student_token, room):
        """Two bookings at the same time should conflict."""
        future = datetime.now() + timedelta(days=5)
        date_str = future.strftime("%Y-%m-%d")

        payload = {
            "ruangan_id": room.id,
            "event_name": "Event A",
            "event_description": "First booking",
            "date": date_str,
            "start_time": "10:00",
            "end_time": "12:00",
            "attendees": "20",
        }
        r1 = client.post("/pengajuan", data=payload,
                         headers={"Authorization": f"Bearer {student_token}"})
        assert r1.status_code == 201

        payload["event_name"] = "Event B"
        payload["event_description"] = "Second booking same slot"
        r2 = client.post("/pengajuan", data=payload,
                         headers={"Authorization": f"Bearer {student_token}"})
        assert r2.status_code == 409


class TestStatusUpdateEndpoint:
    def test_student_cannot_use_status_endpoint(self, client, student_token, room):
        """The /status endpoint should be restricted to admin/staff."""
        future = datetime.now() + timedelta(days=7)
        date_str = future.strftime("%Y-%m-%d")

        r = client.post("/pengajuan", data={
            "ruangan_id": room.id,
            "event_name": "Test",
            "event_description": "Test",
            "date": date_str,
            "start_time": "14:00",
            "end_time": "16:00",
            "attendees": "10",
        }, headers={"Authorization": f"Bearer {student_token}"})
        pid = r.json()["id"]

        r = client.put(
            f"/pengajuan/{pid}/status",
            json={"status": "Disetujui"},
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 403
