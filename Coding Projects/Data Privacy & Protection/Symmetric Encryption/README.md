# Symmetric Encryption System

This project demonstrates per-user key encryption and single-key encryption using the `cryptography.fernet` library for symmetric encryption.

---

## **Features**

### **1. Per-User Key Encryption**

- Generate and manage unique symmetric keys for each user.
- Encrypt and decrypt user-specific data using their unique key.

### **2. Single Key Encryption**

- Use a single shared symmetric key to encrypt and decrypt data for all users.

### **3. Data Security**

- Leverage the `cryptography.fernet` library for AES-128 encryption in CBC mode with HMAC for integrity verification.

---

## **Usage Instructions**

### **Dependencies**

- Python 3.x
- `cryptography`: For symmetric encryption.

Install dependencies:

```bash
pip install cryptography

```

### **Running the Code**

1.  Clone the repository and navigate to the project directory.
2.  Ensure your Python script for encryption is properly configured.
3.  Run the script:

    ```bash
    python script_name.py

    ```

---

## **Code Structure**

### **Per-User Key Encryption**

- Generate a unique Fernet key for each user.
- Save user keys securely (e.g., in a database or encrypted file).
- Encrypt and decrypt user data using the corresponding key.

### **Single Key Encryption**

- Generate a single Fernet key shared across all users.
- Use this key to encrypt and decrypt all data.

---

## **Key Components**

### **Libraries**

- **`cryptography.fernet`**:
  - Provides easy-to-use symmetric encryption with Fernet keys.

### **Directory Structure**

- **Keys Storage**:
  - For per-user encryption, save keys in a secure location.
  - For single-key encryption, save the key in a safe and restricted-access file.

---

## **Security Considerations**

- **Key Storage**:
  - Ensure symmetric keys are stored securely, such as in an encrypted database or key vault.
- **Key Rotation**:
  - Regularly rotate keys to enhance security, especially for long-term usage.
- **Data Confidentiality**:
  - Encrypt sensitive data only and ensure access to keys is restricted.

---

## **Future Improvements**

- Add automated key rotation and re-encryption of data.
- Implement user authentication and key retrieval.
- Introduce audit logging for encryption and decryption events.

---

## **Acknowledgments**

This project uses the `cryptography` library for secure symmetric encryption.
