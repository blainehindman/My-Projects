# Secure SSN Transmission and Storage System

This project implements a **Data Loss Prevention (DLP)** system for securely transmitting, encrypting, storing, and decrypting sensitive Social Security Numbers (SSNs). The solution leverages TLS/SSL for secure transmission and AES encryption for secure storage, ensuring robust protection of sensitive data.

## Features

1. **Random SSN Generation**:

   - Generates fake SSNs for testing purposes.
   - Ensures the integrity of workflows without using real data.

2. **Secure Transmission (TLS/SSL)**:

   - Implements a secure server and client communication using self-signed certificates.
   - Protects sensitive data during transmission over potentially insecure networks.

3. **AES Encryption and Secure Storage**:

   - Encrypts SSNs using the AES algorithm with a securely derived key.
   - Stores encrypted SSNs in a SQLite database for persistence.

4. **Decryption and Retrieval**:

   - Securely retrieves and decrypts SSNs from the database when needed.

5. **Data Loss Prevention (DLP)**:
   - The system demonstrates principles of DLP by:
     - Protecting sensitive data at rest and in transit.
     - Encrypting data to prevent unauthorized access.
     - Simulating secure workflows to minimize the risk of exposure (e.g., controlled environment where a client transmits fake SSNs securely to a server).

---

## How It Works

### Workflow

1. **Certificate Generation**:

   - A self-signed certificate (`server.pem`) and private key (`server.key`) are generated in the same directory as the script. These enable secure TLS communication between the client and server.

2. **Random SSN Generation**:

   - A fake SSN (e.g., `335-31-7060`) is randomly generated for demonstration purposes.

3. **Secure Transmission**:

   - The client sends the SSN over a TLS-encrypted connection to the server.
   - The server receives and logs the SSN securely.

4. **AES Encryption**:

   - The server encrypts the SSN using AES with a securely derived key. The encrypted SSN is stored in a SQLite database.

5. **Decryption**:
   - The system retrieves the encrypted SSN from the database and decrypts it to verify the workflow.

---

## Code Structure

- **`generate_self_signed_cert`**:

  - Generates a self-signed TLS/SSL certificate (`server.pem`) and key (`server.key`).

- **`start_tls_server`**:

  - Creates a secure server to receive SSNs over a TLS connection.

- **`start_tls_client`**:

  - Simulates a client that transmits an SSN securely to the server.

- **`encrypt_ssn`**:

  - Encrypts SSNs using AES encryption with a random initialization vector (IV).

- **`decrypt_ssn`**:

  - Decrypts previously encrypted SSNs.

- **`store_ssn_in_database`**:

  - Stores encrypted SSNs in a SQLite database.

- **`retrieve_ssn_from_database`**:
  - Retrieves encrypted SSNs from the database.

---

## Technology Stack

1. **Python Libraries**:

   - `ssl`: For implementing secure TLS communication.
   - `cryptography`: For AES encryption and self-signed certificate generation.
   - `sqlite3`: For lightweight database storage.
   - `socket`: For client-server communication.

2. **Data Protection Techniques**:
   - TLS/SSL encryption ensures secure transmission.
   - AES encryption ensures secure storage of sensitive data.
   - Random SSN generation avoids handling real data during testing.
