import smtplib
from email.message import EmailMessage
from typing import Protocol


class EmailSender(Protocol):
    def send(self, subject: str, body: str) -> None: ...


def build_message(sender: str, recipient: str, subject: str, body: str) -> str:
    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = recipient
    msg["Subject"] = subject
    msg.set_content(body)
    return msg.as_string()


class SmtpSender:
    def __init__(self, host, port, user, password, sender, recipient, starttls,
                 timeout=10):
        self._host = host
        self._port = port
        self._user = user
        self._password = password
        self._sender = sender
        self._recipient = recipient
        self._starttls = starttls
        self._timeout = timeout

    def send(self, subject: str, body: str) -> None:
        raw = build_message(self._sender, self._recipient, subject, body)
        # timeout: a relay that accepts TCP but never replies must not freeze the
        # paho network thread (and hold the SQLite write lock) indefinitely.
        with smtplib.SMTP(self._host, self._port, timeout=self._timeout) as client:
            if self._starttls:
                client.starttls()
            if self._user:
                client.login(self._user, self._password)
            client.sendmail(self._sender, self._recipient, raw)
