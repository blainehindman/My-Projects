# Key.py
import os
from cryptography.fernet import Fernet

def generate_key(user_id):
    """Generate and save a unique key for a user."""
    # Define the KeyVault directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    key_vault_dir = os.path.join(script_dir, "KeyVault")
    os.makedirs(key_vault_dir, exist_ok=True)

    # Define the key file path
    key_path = os.path.join(key_vault_dir, f"key_{user_id}.key")

    # Generate the key
    key = Fernet.generate_key()
    with open(key_path, "wb") as key_file:
        key_file.write(key)

    print(f"Key generated and saved to: {key_path}")


def load_key(user_id):
    """Load a user's unique encryption key from the KeyVault."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    key_vault_dir = os.path.join(script_dir, "KeyVault")
    key_path = os.path.join(key_vault_dir, f"key_{user_id}.key")

    if not os.path.exists(key_path):
        raise FileNotFoundError(f"Key file not found at {key_path}. Please generate it first.")

    with open(key_path, "rb") as key_file:
        return key_file.read()

# Uncomment to generate a key for a specific user (e.g., user ID 1)
# generate_key(user_id=1)

# Fernet.py
import sqlite3
from faker import Faker
import os
from cryptography.fernet import Fernet
from Key import generate_key, load_key

fake = Faker()

db_path = os.path.join(os.path.dirname(__file__), "mock_user_data.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def encrypt_data(data, key):
    f = Fernet(key)
    return f.encrypt(data.encode()).decode()

def decrypt_data(data, key):
    f = Fernet(key)
    return f.decrypt(data.encode()).decode()

def create_tables():
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
    print("Tables created successfully.")

def populate_database(num_records):
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

def fetch_data():
    cursor.execute("SELECT id, email FROM users")
    return cursor.fetchall()

def update_data(id, encrypted_value):
    cursor.execute("UPDATE users SET email = ? WHERE id = ?", (encrypted_value, id))
    conn.commit()

def main():
    while True:
        print("\nMenu:")
        print("1. View Data")
        print("2. Encrypt Data")
        print("3. Decrypt Data")
        print("4. Create Mock Data")
        print("5. Exit")
        choice = input("Enter your choice: ")

        if choice == "1":
            data = fetch_data()
            for row in data:
                print(f"ID: {row[0]}, Email: {row[1]}")

        elif choice == "2":
            user_id = input("Enter the ID of the user to encrypt: ")
            cursor.execute("SELECT email FROM users WHERE id = ?", (user_id,))
            result = cursor.fetchone()
            if result:
                email = result[0]
                generate_key(user_id)
                key = load_key(user_id)
                encrypted_email = encrypt_data(email, key)
                update_data(user_id, encrypted_email)
                print(f"Encrypted email for user ID {user_id}: {encrypted_email}")
            else:
                print("User not found.")

        elif choice == "3":
            user_id = input("Enter the ID of the user to decrypt: ")
            cursor.execute("SELECT email FROM users WHERE id = ?", (user_id,))
            result = cursor.fetchone()
            if result:
                encrypted_email = result[0]
                try:
                    key = load_key(user_id)
                    decrypted_email = decrypt_data(encrypted_email, key)
                    print(f"Decrypted email for user ID {user_id}: {decrypted_email}")
                except Exception as e:
                    print(f"Error decrypting email: {e}")
            else:
                print("User not found.")

        elif choice == "4":
            num_records = int(input("Enter the number of mock records to create: "))
            populate_database(num_records)

        elif choice == "5":
            print("Exiting...")
            break

        else:
            print("Invalid choice. Please try again.")

    conn.close()

if __name__ == "__main__":
    create_tables()
    main()
