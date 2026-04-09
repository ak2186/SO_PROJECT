"""
Email Utility
Sends OTP emails via Gmail SMTP
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config.settings import settings

logger = logging.getLogger(__name__)


def send_otp_email(to_email: str, otp: str) -> bool:
    """Send a password-reset OTP to the given email address.

    Returns True on success, False on failure (logged, never raises).
    """
    subject = "HEALIX - Password Reset OTP"
    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fbff; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <span style="display: inline-block; background: linear-gradient(135deg, #1d4ed8, #0891b2); color: #fff; font-weight: 800; font-size: 14px; padding: 10px 18px; border-radius: 12px; letter-spacing: 0.12em;">Hx</span>
            <span style="margin-left: 10px; font-weight: 700; font-size: 18px; color: #0f172a; letter-spacing: 0.08em;">HEALIX</span>
        </div>
        <h2 style="text-align: center; color: #0f172a; margin: 0 0 8px;">Password Reset</h2>
        <p style="text-align: center; color: #64748b; font-size: 14px; margin: 0 0 24px;">Use the code below to reset your password. It expires in 10 minutes.</p>
        <div style="text-align: center; background: #ffffff; border: 1px solid #d5deee; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 0.3em; color: #1d4ed8;">{otp}</span>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin: 0;">If you did not request this, you can safely ignore this email.</p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"HEALIX <{settings.SMTP_EMAIL}>"
    msg["To"] = to_email
    msg.attach(MIMEText(f"Your HEALIX password reset code is: {otp}\n\nIt expires in 10 minutes.", "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(settings.SMTP_EMAIL, settings.SMTP_APP_PASSWORD)
            server.sendmail(settings.SMTP_EMAIL, to_email, msg.as_string())
        logger.info(f"OTP email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email to {to_email}: {e}")
        return False
