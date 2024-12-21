# Encryption Project

## Overview

This project is organized into two main folders, **Asymmetric Encryption** and **Symmetric Encryption**, each serving distinct purposes and employing industry-standard encryption methods. Additionally, it incorporates a mock KeyVault for secure key storage and a mock database containing sensitive personally identifiable information (PII).

---

## Folder Structure

### 1. **Asymmetric Encryption**

- **Encryption Method**: RSA (Rivest-Shamir-Adleman)
- **Purpose**: Asymmetric encryption is used for encrypting and securely exchanging small amounts of data or encrypting symmetric keys for secure transmission.
- **Key Management**: RSA public and private keys are securely stored in the mock KeyVault.
- **Usage Examples**:

  - Encrypting sensitive PII before sharing between systems.
  - Verifying digital signatures.

### 2. **Symmetric Encryption**

- **Encryption Method**: Fernet (a symmetric encryption method from the cryptography library).
- **Purpose**: Symmetric encryption is employed for encrypting larger datasets and ensuring confidentiality during storage or transmission.
- **Key Management**: The Fernet key is securely managed in the mock KeyVault.
- **Usage Examples**:

  - Encrypting PII in the database.
  - Securing large files or data streams.

---

## Key Management

- **Mock KeyVault**: A simulated key management system is used to securely store encryption keys. This ensures separation of key management and data processing, following best security practices.

  - Keys are categorized based on their encryption type (e.g., RSA keys, Fernet keys).

---

## Database

- **Mock Database**: This project uses a mock database to simulate the storage and handling of PII.

  - Fields may include names, addresses, social security numbers, and other sensitive data.
  - Encryption ensures that PII remains secure both at rest and in transit.

---

## Security Practices

1.  **Key Vault**: Keys are never hardcoded or stored in plain text. All keys are accessed via the mock KeyVault.
2.  **Encryption/Decryption Isolation**: Encryption and decryption operations are isolated from other logic to reduce risk.
3.  **PII Handling**: Sensitive data is encrypted before being stored in or transmitted from the mock database.

---

## Future Enhancements

- Integrate a real KeyVault service such as Azure KeyVault or AWS KMS for production-grade key management.
- Replace the mock database with a secure, real-world database implementation.
- Implement additional encryption algorithms for expanded functionality.
- Add logging for auditing encryption/decryption operations without exposing sensitive data.

---

## Usage Instructions

- To use RSA, navigate to the **Asymmetric Encryption** folder and follow the documentation/scripts.
- For Fernet, go to the **Symmetric Encryption** folder and use the provided tools/scripts.
- Ensure the mock KeyVault is initialized before running any encryption/decryption processes.
- Use mock database scripts to test storing and retrieving encrypted PII.
