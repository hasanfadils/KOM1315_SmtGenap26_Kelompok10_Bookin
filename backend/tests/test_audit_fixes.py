import pytest
from datetime import datetime, timedelta, timezone
from app.models import Ruangan, RuanganType, RuanganStatus, Pengajuan, User, UserRole, DokumenPengajuan
from app.models.enums import PengajuanStatus
from app.services.auth_service import AuthService


@pytest.fixture
def test_room(db) -> Ruangan:
    """Fixture for a standard test room (AHN)."""
    room = Ruangan(
        name="Auditorium AHN",
        type=RuanganType.AUDITORIUM,
        status=RuanganStatus.AVAILABLE,
        capacity=800,
        location="Gedung Rektorat",
        description="Auditorium utama IPB",
        image_url="http://placehold.co/image.png",
        features=["AC", "Sound System"],
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@pytest.fixture
def other_room(db) -> Ruangan:
    """Fixture for another test room (GWW)."""
    room = Ruangan(
        name="Graha Widya Wisuda",
        type=RuanganType.AUDITORIUM,
        status=RuanganStatus.AVAILABLE,
        capacity=3000,
        location="Dramaga",
        description="Gedung ikonik",
        image_url="http://placehold.co/image.png",
        features=["Tribun"],
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@pytest.fixture
def approved_pengajuan(db, test_room, student_user) -> Pengajuan:
    """Fixture for an approved pengajuan."""
    pengajuan = Pengajuan(
        ruangan_id=test_room.id,
        user_id=student_user.id,
        user_name=student_user.name,
        event_name="Seminar Nasional",
        event_description="Seminar seru",
        start_time=datetime.now(timezone.utc) + timedelta(days=1),
        end_time=datetime.now(timezone.utc) + timedelta(days=1, hours=3),
        attendees=100,
        status=PengajuanStatus.DISETUJUI,
    )
    db.add(pengajuan)
    db.commit()
    db.refresh(pengajuan)
    return pengajuan


@pytest.fixture
def pending_pengajuan(db, test_room, student_user) -> Pengajuan:
    """Fixture for a pending pengajuan."""
    pengajuan = Pengajuan(
        ruangan_id=test_room.id,
        user_id=student_user.id,
        user_name=student_user.name,
        event_name="Seminar Pending",
        event_description="Seminar belum disetujui",
        start_time=datetime.now(timezone.utc) + timedelta(days=2),
        end_time=datetime.now(timezone.utc) + timedelta(days=2, hours=3),
        attendees=50,
        status=PengajuanStatus.MENUNGGU_VERIFIKASI,
    )
    db.add(pengajuan)
    db.commit()
    db.refresh(pengajuan)
    return pengajuan


class TestAuditFixes:
    def test_student_cannot_delete_approved_pengajuan(self, client, student_token, approved_pengajuan):
        """Test that a regular student cannot delete an approved booking."""
        response = client.delete(
            f"/pengajuan/{approved_pengajuan.id}",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert response.status_code == 400
        assert "tidak dapat dihapus" in response.json()["detail"]

    def test_student_can_delete_pending_pengajuan(self, client, student_token, pending_pengajuan):
        """Test that a student can delete a pending booking."""
        response = client.delete(
            f"/pengajuan/{pending_pengajuan.id}",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert response.status_code == 200
        assert "berhasil dihapus" in response.json()["message"]

    def test_cannot_delete_room_with_active_booking(self, client, admin_token, test_room, approved_pengajuan):
        """Test that a room cannot be deleted if it has an active booking."""
        response = client.delete(
            f"/ruangan/{test_room.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 400
        assert "memiliki pengajuan/peminjaman aktif" in response.json()["detail"]

    def test_scoped_tendik_authorization(self, db, client, approved_pengajuan, other_room):
        """Test that a Tendik scoped only to 'other_room' cannot verify/reject for 'test_room'."""
        # Create scoped Tendik
        scoped_tendik = User(
            name="Tendik GWW Only",
            email="tendik_gww_only@test.com",
            password_hash=AuthService.hash_password("password123"),
            role=UserRole.staff,
            managed_ruangan_ids=[other_room.id],  # Only manages other_room
        )
        db.add(scoped_tendik)
        db.commit()
        db.refresh(scoped_tendik)
        scoped_tendik_token = AuthService.create_access_token({"sub": scoped_tendik.id})

        # Set booking to MENUNGGU_VERIFIKASI first so it can be verified
        approved_pengajuan.status = PengajuanStatus.MENUNGGU_VERIFIKASI
        db.commit()

        # Scoped Tendik tries to verify booking in test_room
        response = client.put(
            f"/pengajuan/{approved_pengajuan.id}/verify",
            headers={"Authorization": f"Bearer {scoped_tendik_token}"},
        )
        assert response.status_code == 403
        assert "bukan penanggung jawab" in response.json()["detail"]

    def test_secure_document_access(self, db, client, student_token, tendik_token, approved_pengajuan):
        """Test that files served via /uploads/{filename} are authenticated and authorize-protected."""
        # Create a document record
        doc = DokumenPengajuan(
            pengajuan_id=approved_pengajuan.id,
            filename="proposal.pdf",
            file_url="/uploads/secret_proposal.pdf",
            file_type="application/pdf",
            file_size=50000,
        )
        db.add(doc)
        db.commit()

        # Unauthenticated request
        response = client.get("/uploads/secret_proposal.pdf")
        assert response.status_code == 403

        # Authenticated, but unauthorized user (another student)
        unauthorized_student = User(
            name="Other Student",
            email="other@test.com",
            password_hash=AuthService.hash_password("password123"),
            role=UserRole.student,
        )
        db.add(unauthorized_student)
        db.commit()
        db.refresh(unauthorized_student)
        unauthorized_token = AuthService.create_access_token({"sub": unauthorized_student.id})

        response = client.get(
            "/uploads/secret_proposal.pdf",
            headers={"Authorization": f"Bearer {unauthorized_token}"},
        )
        assert response.status_code == 403
        assert "tidak berhak mengakses" in response.json()["detail"]

        # Authorized user (owner of booking)
        response = client.get(
            "/uploads/secret_proposal.pdf",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        # It fails with 404 physical file not found because the file doesn't actually exist on disk in test env,
        # but 404 means it successfully passed authorization!
        assert response.status_code == 404
        assert "File fisik" in response.json()["detail"]
