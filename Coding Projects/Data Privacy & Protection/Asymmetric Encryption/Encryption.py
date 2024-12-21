from Crypto.Cipher import PKCS1_OAEP
from Crypto.PublicKey import RSA
from faker import Faker
import sqlite3
import os

fake = Faker()

# RSA Key Management
def generate_rsa_keys(user_id):
    """Generate and save RSA keys for a user."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    key_vault_dir = os.path.join(script_dir, "KeyVault")
    os.makedirs(key_vault_dir, exist_ok=True)

    private_key_path = os.path.join(key_vault_dir, f"private_{user_id}.pem")
    public_key_path = os.path.join(key_vault_dir, f"public_{user_id}.pem")

    key = RSA.generate(2048)
    private_key = key.export_key()
    public_key = key.publickey().export_key()

    with open(private_key_path, "wb") as private_file:
        private_file.write(private_key)
    with open(public_key_path, "wb") as public_file:
        public_file.write(public_key)

    print(f"RSA keys generated for user ID {user_id} and saved to {key_vault_dir}.")

def load_rsa_key(user_id, key_type):
    """Load RSA public or private key."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    key_path = os.path.join(script_dir, "KeyVault", f"{key_type}_{user_id}.pem")

    if not os.path.exists(key_path):
        raise FileNotFoundError(f"{key_type.capitalize()} key not found for user ID {user_id}. Please generate it first.")

    with open(key_path, "rb") as key_file:
        return RSA.import_key(key_file.read())

# Encryption and Decryption
def encrypt_data_rsa(data, public_key):
    """Encrypt data using RSA public key."""
    cipher = PKCS1_OAEP.new(public_key)
    encrypted_data = cipher.encrypt(data.encode())
    return encrypted_data

def decrypt_data_rsa(encrypted_data, private_key):
    """Decrypt data using RSA private key."""
    cipher = PKCS1_OAEP.new(private_key)
    decrypted_data = cipher.decrypt(encrypted_data)
    return decrypted_data.decode()

# Database Management
def create_mock_database():
    db_path = os.path.join(os.path.dirname(__file__), "mock_user_data.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone_number TEXT NOT NULL,
        address TEXT NOT NULL,
        ssn TEXT UNIQUE NOT NULL,
        date_of_birth DATE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
    """)

    print("Database and table created successfully.")
    conn.commit()
    return conn, cursor

def populate_database(cursor, conn, num_records):
    for _ in range(num_records):
        first_name = fake.first_name()
        last_name = fake.last_name()
        email = fake.unique.email()
        phone_number = fake.phone_number()
        address = fake.address().replace("\n", ", ")
        ssn = fake.unique.ssn()
        date_of_birth = str(fake.date_of_birth())
        username = fake.unique.user_name()
        password = fake.password(length=12)

        cursor.execute("""
        INSERT INTO users (
            first_name, last_name, email, phone_number, address, ssn, date_of_birth, username, password
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (first_name, last_name, email, phone_number, address, ssn, date_of_birth, username, password))
    conn.commit()
    print(f"Inserted {num_records} mock records successfully.")

def fetch_user_email(cursor, user_id):
    """Fetch the email of a user by ID."""
    cursor.execute("SELECT email FROM users WHERE id = ?", (user_id,))
    return cursor.fetchone()

def update_user_email(cursor, conn, user_id, email):
    """Update the email of a user by ID."""
    cursor.execute("UPDATE users SET email = ? WHERE id = ?", (email, user_id))
    conn.commit()

# Main Program
def main():
    conn, cursor = create_mock_database()

    while True:
        print("\nMenu:")
        print("1. Generate RSA Keys for User")
        print("2. Encrypt Email")
        print("3. Decrypt Email")
        print("4. Populate Mock Database")
        print("5. View User Emails")
        print("6. Exit")
        choice = input("Enter your choice: ")

        if choice == "1":
            user_id = input("Enter user ID: ")
            generate_rsa_keys(user_id)

        elif choice == "2":
            user_id = input("Enter user ID to encrypt email: ")
            user_data = fetch_user_email(cursor, user_id)
            if user_data:
                email = user_data[0]
                public_key = load_rsa_key(user_id, "public")
                encrypted_email = encrypt_data_rsa(email, public_key)
                update_user_email(cursor, conn, user_id, encrypted_email.hex())
                print(f"Encrypted email for user ID {user_id}: {encrypted_email.hex()}")
            else:
                print("User not found.")

        elif choice == "3":
            user_id = input("Enter user ID to decrypt email: ")
            user_data = fetch_user_email(cursor, user_id)
            if user_data:
                encrypted_email = bytes.fromhex(user_data[0])
                private_key = load_rsa_key(user_id, "private")
                decrypted_email = decrypt_data_rsa(encrypted_email, private_key)
                print(f"Decrypted email for user ID {user_id}: {decrypted_email}")
            else:
                print("User not found.")

        elif choice == "4":
            num_records = int(input("Enter the number of mock records to create: "))
            populate_database(cursor, conn, num_records)

        elif choice == "5":
            cursor.execute("SELECT id, email FROM users")
            records = cursor.fetchall()
            for record in records:
                print(f"ID: {record[0]}, Email: {record[1]}")

        elif choice == "6":
            print("Exiting...")
            conn.close()
            break

        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()
