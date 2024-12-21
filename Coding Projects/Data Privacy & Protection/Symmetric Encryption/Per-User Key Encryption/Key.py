import os
from cryptography.fernet import Fernet

def create_keyvault():
    """Create a KeyVault directory to store unique encryption keys for each user."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    keyvault_dir = os.path.join(script_dir, "KeyVault")
    if not os.path.exists(keyvault_dir):
        os.makedirs(keyvault_dir)
        print(f"KeyVault directory created at: {keyvault_dir}")
    else:
        print(f"KeyVault directory already exists at: {keyvault_dir}")
    return keyvault_dir

def generate_key(user_id):
    """Generate and save a unique key for a user."""
    key_vault_dir = create_keyvault()
    key_path = os.path.join(key_vault_dir, f"key_{user_id}.key")
    key = Fernet.generate_key()
    with open(key_path, "wb") as key_file:
        key_file.write(key)
    print(f"Key generated and saved to: {key_path}")

def load_key(user_id):
    """Load a user's unique encryption key from the KeyVault."""
    key_vault_dir = create_keyvault()
    key_path = os.path.join(key_vault_dir, f"key_{user_id}.key")
    if not os.path.exists(key_path):
        raise FileNotFoundError(f"Key file not found at {key_path}. Please generate it first.")
    with open(key_path, "rb") as key_file:
        return key_file.read()
