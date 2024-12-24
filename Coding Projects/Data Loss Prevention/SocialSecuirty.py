import sqlite3
import ssl
import socket
import random
import os
import base64
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from threading import Thread

# Get the absolute path to the directory containing the script
script_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(script_dir, "secure_ssn.db")

# Generate a random fake SSN
def generate_fake_ssn():
    ssn = f"{random.randint(100, 999)}-{random.randint(10, 99)}-{random.randint(1000, 9999)}"
    return ssn

# Securely encrypt the SSN using AES
def encrypt_ssn(ssn, key):
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key), modes.CFB(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    encrypted_ssn = encryptor.update(ssn.encode()) + encryptor.finalize()
    return base64.b64encode(iv + encrypted_ssn).decode()

# Decrypt the SSN using AES
def decrypt_ssn(encrypted_ssn, key):
    data = base64.b64decode(encrypted_ssn)
    iv, encrypted_ssn = data[:16], data[16:]
    cipher = Cipher(algorithms.AES(key), modes.CFB(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    return decryptor.update(encrypted_ssn) + decryptor.finalize()

# Generate a secure AES key
def generate_aes_key(password, salt):
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend(),
    )
    return kdf.derive(password.encode())

# Secure Transmission Simulation (TLS/SSL)
def start_tls_server():
    # Simulated server that receives the SSN securely
    context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    context.load_cert_chain(certfile="server.pem", keyfile="server.key")

    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    secure_server = context.wrap_socket(server_socket, server_side=True)
    secure_server.bind(('localhost', 65432))
    secure_server.listen(1)
    print("Server is ready to securely receive data (TLS/SSL enabled).")

    conn, addr = secure_server.accept()
    print(f"Secure connection established with {addr}.")
    data = conn.recv(1024).decode()
    print(f"Securely received SSN: {data}")
    conn.close()
    secure_server.close()

def start_tls_client(ssn):
    # Simulated client that transmits the SSN securely
    context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE

    with socket.create_connection(('localhost', 65432)) as sock:
        with context.wrap_socket(sock, server_hostname='localhost') as secure_client:
            print(f"Securely transmitting SSN: {ssn}")
            secure_client.send(ssn.encode())

# Store the encrypted SSN in a SQLite database
def store_ssn_in_database(encrypted_ssn):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("CREATE TABLE IF NOT EXISTS ssn_data (id INTEGER PRIMARY KEY, encrypted_ssn TEXT)")
    cursor.execute("INSERT INTO ssn_data (encrypted_ssn) VALUES (?)", (encrypted_ssn,))
    conn.commit()
    conn.close()

# Retrieve the encrypted SSN from the database
def retrieve_ssn_from_database():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT encrypted_ssn FROM ssn_data ORDER BY id DESC LIMIT 1")
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else None

# Main program
if __name__ == "__main__":
    # Generate a fake SSN
    fake_ssn = generate_fake_ssn()
    print(f"Generated SSN: {fake_ssn}")

    # Start the TLS/SSL server in a separate thread
    server_thread = Thread(target=start_tls_server)
    server_thread.start()

    # Simulate secure transmission
    start_tls_client(fake_ssn)

    server_thread.join()

    # Generate AES key for secure storage
    salt = os.urandom(16)
    key = generate_aes_key("secure_password", salt)

    # Encrypt the SSN and store it securely
    encrypted_ssn = encrypt_ssn(fake_ssn, key)
    store_ssn_in_database(encrypted_ssn)
    print(f"Encrypted SSN securely stored: {encrypted_ssn}")

    # Retrieve and decrypt the SSN from the database
    retrieved_encrypted_ssn = retrieve_ssn_from_database()
    decrypted_ssn = decrypt_ssn(retrieved_encrypted_ssn, key).decode()
    print(f"Decrypted SSN (retrieved from database): {decrypted_ssn}")
