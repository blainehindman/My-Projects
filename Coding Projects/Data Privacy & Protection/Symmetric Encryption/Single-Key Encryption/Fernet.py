import sqlite3
from faker import Faker
import os
from cryptography.fernet import Fernet

# Initialize Faker instance
fake = Faker()

# Create a connection to the SQLite database in the same folder as the Python script
db_path = os.path.join(os.path.dirname(__file__), "mock_user_data.db")
conn = sqlite3.connect(db_path)

# Create a cursor object to execute SQL commands
cursor = conn.cursor()

# Load the encryption key
def load_key():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    key_path = os.path.join(script_dir, "key.key")
    if not os.path.exists(key_path):
        raise FileNotFoundError(f"Key file not found at {key_path}. Please generate it first.")
    with open(key_path, "rb") as key_file:
        return key_file.read()

# Encrypt data
def encrypt_data(data, key):
    f = Fernet(key)
    return f.encrypt(data.encode()).decode()

# Decrypt data
def decrypt_data(data, key):
    f = Fernet(key)
    return f.decrypt(data.encode()).decode()

# Define a function to create tables
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

# Populate the database with mock data
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

# Fetch data from the database
def fetch_data():
    cursor.execute("SELECT id, email FROM users")  # Modify column as needed
    return cursor.fetchall()

# Update data in the database
def update_data(id, encrypted_value):
    cursor.execute("UPDATE users SET email = ? WHERE id = ?", (encrypted_value, id))
    conn.commit()

# Menu-driven script
def main():
    key = load_key()

    while True:
        print("\nMenu:")
        print("1. View Data")
        print("2. Encrypt Data")
        print("3. Decrypt Data")
        print("4. Create Mock Data")
        print("5. Exit")
        choice = input("Enter your choice: ")

        if choice == "1":
            try:
                data = fetch_data()
                for row in data:
                    print(f"ID: {row[0]}, Email: {row[1]}")
            except sqlite3.Error as e:
                print(f"Error fetching data: {e}")

        elif choice == "2":
            try:
                id = input("Enter the ID of the data to encrypt: ")
                cursor.execute("SELECT email FROM users WHERE id = ?", (id,))
                value = cursor.fetchone()[0]
                if value:
                    encrypted_value = encrypt_data(value, key)
                    update_data(id, encrypted_value)
                    print(f"Data encrypted and updated for ID {id}: {encrypted_value}")
                else:
                    print("No value found for the given ID.")
            except sqlite3.Error as e:
                print(f"Error encrypting data: {e}")

        elif choice == "3":
            try:
                id = input("Enter the ID of the data to decrypt: ")
                cursor.execute("SELECT email FROM users WHERE id = ?", (id,))
                encrypted_value = cursor.fetchone()[0]
                if encrypted_value:
                    decrypted_value = decrypt_data(encrypted_value, key)
                    print(f"Decrypted value for ID {id}: {decrypted_value}")
                    
                    # Update the database with the decrypted value
                    update_data(id, decrypted_value)
                    print(f"Database updated with the decrypted value for ID {id}.")
                else:
                    print("No value found for the given ID.")
            except sqlite3.Error as e:
                print(f"Error decrypting data: {e}")
            except Exception as e:
                print(f"Decryption failed: {e}")

        elif choice == "4":
            try:
                num_records = int(input("Enter the number of mock records to create: "))
                populate_database(num_records)
            except ValueError:
                print("Please enter a valid number.")
            except sqlite3.Error as e:
                print(f"Error creating mock data: {e}")

        elif choice == "5":
            print("Exiting...")
            break

        else:
            print("Invalid choice. Please try again.")

    conn.close()

if __name__ == "__main__":
    create_tables()
    main()
