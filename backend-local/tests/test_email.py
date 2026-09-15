from app.email import SmtpSender, build_message


def test_build_message_has_headers():
    raw = build_message("de@x", "vers@y", "Sujet é", "Corps àù")
    assert "Subject: " in raw
    assert "vers@y" in raw
    assert "de@x" in raw


def test_smtp_sender_uses_client(monkeypatch):
    calls = {}

    class FakeSMTP:
        def __init__(self, host, port, timeout=None):
            calls["addr"] = (host, port)
            calls["timeout"] = timeout

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

        def starttls(self):
            calls["tls"] = True

        def login(self, u, p):
            calls["login"] = (u, p)

        def sendmail(self, frm, to, msg):
            calls["sent"] = (frm, to, msg)

    monkeypatch.setattr("app.email.smtplib.SMTP", FakeSMTP)
    s = SmtpSender(host="mx", port=25, user="", password="", sender="de@x",
                   recipient="vers@y", starttls=False)
    s.send("Sujet", "Corps")
    assert calls["addr"] == ("mx", 25)
    assert calls["sent"][0] == "de@x"
    assert calls["sent"][1] == "vers@y"
