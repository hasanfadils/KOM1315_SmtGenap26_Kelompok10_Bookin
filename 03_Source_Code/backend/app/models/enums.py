"""Enum yang digunakan bersama oleh model SQLAlchemy dan schema Pydantic."""

import enum


class UserRole(str, enum.Enum):
    student = "student"
    staff = "staff"      # Tendik
    admin = "admin"


class RuanganType(str, enum.Enum):
    AUDITORIUM = "Auditorium"
    CLASSROOM = "Ruang Kelas"
    FIELD = "Lapangan"
    LABORATORY = "Laboratorium"
    MEETING_ROOM = "Ruang Rapat"


class RuanganStatus(str, enum.Enum):
    AVAILABLE = "Tersedia"
    MAINTENANCE = "Pemeliharaan"
    RENOVATION = "Renovasi"
    CLOSED = "Ditutup Sementara"


class PengajuanStatus(str, enum.Enum):
    MENUNGGU_VERIFIKASI = "Menunggu Persetujuan"
    DIVERIFIKASI_TENDIK = "Sedang Direview"
    DISETUJUI = "Disetujui"
    DITOLAK = "Ditolak"
    SELESAI = "Selesai"


class NotificationType(str, enum.Enum):
    BOOKING_STATUS = "BOOKING_STATUS"
    VERIFICATION = "VERIFICATION"
    SYSTEM = "SYSTEM"
