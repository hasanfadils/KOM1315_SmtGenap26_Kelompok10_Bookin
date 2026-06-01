"""
Hierarki exception kustom untuk error logika bisnis (OOP).
"""


class AppException(Exception):
    """Base exception untuk error logika bisnis."""

    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundException(AppException):
    """Exception jika entitas tidak ditemukan."""

    def __init__(self, entity: str, entity_id: str):
        super().__init__(
            message=f"{entity} dengan id '{entity_id}' tidak ditemukan",
            status_code=404,
        )


class ConflictException(AppException):
    """Exception jika terjadi konflik (misal: jadwal bentrok)."""

    def __init__(self, message: str):
        super().__init__(message=message, status_code=409)


class ForbiddenException(AppException):
    """Exception jika pengguna tidak memiliki izin akses."""

    def __init__(self, message: str = "Akses ditolak"):
        super().__init__(message=message, status_code=403)


class UnauthorizedException(AppException):
    """Exception jika autentikasi gagal."""

    def __init__(self, message: str = "Token tidak valid atau sudah kedaluwarsa"):
        super().__init__(message=message, status_code=401)


class ValidationException(AppException):
    """Exception jika validasi input logika bisnis gagal."""

    def __init__(self, message: str):
        super().__init__(message=message, status_code=422)
