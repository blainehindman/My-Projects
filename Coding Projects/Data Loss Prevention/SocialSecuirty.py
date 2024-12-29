import os
import sqlite3
import ssl
import socket
import random
import base64
import time
from datetime import datetime, timedelta, timezone
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from threading import Thread

# Generate self-signed certificate and key in the same folder as this script
def generate_self_signed_cert():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    cert_path = os.path.join(script_dir, "server.pem")
    key_path = os.path.join(script_dir, "server.key")

    if os.path.exists(cert_path) and os.path.exists(key_path):
        print("Certificate and key already exist, skipping generation.")
        return

    key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )

    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Washington"),
        x509.NameAttribute(NameOID.LOCALITY_NAME, "Seattle"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "MyOrganization"),
        x509.NameAttribute(NameOID.COMMON_NAME, "localhost"),
    ])
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.now(timezone.utc))
        .not_valid_after(datetime.now(timezone.utc) + timedelta(days=365))
        .add_extension(
            x509.SubjectAlternativeName([x509.DNSName("localhost")]),
            critical=False,
        )
        .sign(key, hashes.SHA256())
    )

    with open(key_path, "wb") as key_file:
        key_file.write(
            key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption(),
            )
        )

    with open(cert_path, "wb") as cert_file:
        cert_file.write(cert.public_bytes(serialization.Encoding.PEM))

    print(f"Self-signed certificate and key have been generated:\n- {cert_path}\n- {key_path}")


# Generate a fake SSN
def generate_fake_ssn():
    return f"{random.randint(100, 999)}-{random.randint(10, 99)}-{random.randint(1000, 9999)}"

# Securely encrypt the SSN using AES
def encrypt_ssn(ssn, key):
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key), modes.CFB(iv))
    encryptor = cipher.encryptor()
    encrypted_ssn = encryptor.update(ssn.encode()) + encryptor.finalize()
    return base64.b64encode(iv + encrypted_ssn).decode()

# Decrypt the SSN using AES
def decrypt_ssn(encrypted_ssn, key):
    data = base64.b64decode(encrypted_ssn)
    iv, encrypted_ssn = data[:16], data[16:]
    cipher = Cipher(algorithms.AES(key), modes.CFB(iv))
    decryptor = cipher.decryptor()
    return decryptor.update(encrypted_ssn) + decryptor.finalize()

# Generate a secure AES key
def generate_aes_key(password, salt):
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    return kdf.derive(password.encode())

# Secure Transmission Simulation (TLS/SSL)
def start_tls_server():
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        cert_path = os.path.join(script_dir, "server.pem")
        key_path = os.path.join(script_dir, "server.key")

        context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        context.load_cert_chain(certfile=cert_path, keyfile=key_path)

        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        secure_server = context.wrap_socket(server_socket, server_side=True)
        secure_server.bind(('localhost', 65432))
        secure_server.listen(1)
        print("Server is ready to securely receive data (TLS/SSL enabled).")

        conn, addr = secure_server.accept()
        print(f"Secure connection established with {addr}.")

        # Read all chunks of data
        received_data = []
        while True:
            chunk = conn.recv(1024)  # Read 1024 bytes at a time
            if not chunk:  # If no more data, break the loop
                break
            received_data.append(chunk)

        # Decode the received data
        data = b"".join(received_data).decode()
        if data:
            print(f"Securely received SSN: {data}")
        else:
            print("No data received!")

        conn.close()
        secure_server.close()
    except Exception as e:
        print(f"Server error: {e}")


def start_tls_client(ssn):
    try:
        context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE

        with socket.create_connection(('localhost', 65432)) as sock:
            with context.wrap_socket(sock, server_hostname='localhost') as secure_client:
                print(f"Client is sending: {ssn}")
                secure_client.sendall(ssn.encode())  # Ensure all data is sent
                time.sleep(0.5)  # Short delay to allow server to process
                secure_client.shutdown(socket.SHUT_RDWR)  # Graceful shutdown
                secure_client.close()
    except Exception as e:
        print(f"Client error: {e}")


# Main program
if __name__ == "__main__":
    # Generate certificates if not already present
    generate_self_signed_cert()

    # Generate a fake SSN
    fake_ssn = generate_fake_ssn()
    print(f"Generated SSN: {fake_ssn}")

    # Start the TLS/SSL server in a separate thread
    server_thread = Thread(target=start_tls_server)
    server_thread.start()

    # Simulate secure transmission
    from time import sleep
    sleep(2)  # Give server time to initialize
    start_tls_client(fake_ssn)

    server_thread.join()

    # Generate AES key for secure storage
    salt = os.urandom(16)
    key = generate_aes_key("secure_password", salt)

    # Encrypt the SSN and store it securely
    encrypted_ssn = encrypt_ssn(fake_ssn, key)
    print(f"Encrypted SSN securely stored: {encrypted_ssn}")

    # Simulate retrieving and decrypting the SSN
    decrypted_ssn = decrypt_ssn(encrypted_ssn, key).decode()
    print(f"Decrypted SSN: {decrypted_ssn}")
