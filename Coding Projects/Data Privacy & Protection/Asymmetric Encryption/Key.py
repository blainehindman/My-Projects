import os
from Crypto.PublicKey import RSA

def create_keyvault():
    """Create a KeyVault directory to store unique RSA keys for each user."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    keyvault_dir = os.path.join(script_dir, "KeyVault")
    if not os.path.exists(keyvault_dir):
        os.makedirs(keyvault_dir)
        print(f"KeyVault directory created at: {keyvault_dir}")
    else:
        print(f"KeyVault directory already exists at: {keyvault_dir}")
    return keyvault_dir

def generate_rsa_keys(user_id):
    """Generate RSA key pair for a user and store them in the KeyVault."""
    keyvault_dir = create_keyvault()
    private_key_path = os.path.join(keyvault_dir, f"private_{user_id}.pem")
    public_key_path = os.path.join(keyvault_dir, f"public_{user_id}.pem")

    # Generate RSA keys
    key = RSA.generate(2048)
    private_key = key.export_key()
    public_key = key.publickey().export_key()

    # Save the private key
    with open(private_key_path, "wb") as private_file:
        private_file.write(private_key)

    # Save the public key
    with open(public_key_path, "wb") as public_file:
        public_file.write(public_key)

    print(f"RSA keys generated for user ID {user_id}.")
    print(f"Private Key: {private_key_path}")
    print(f"Public Key: {public_key_path}")

def load_rsa_key(user_id, key_type="private"):
    """Load a user's RSA key (private or public) from the KeyVault."""
    keyvault_dir = create_keyvault()
    key_path = os.path.join(keyvault_dir, f"{key_type}_{user_id}.pem")

    if not os.path.exists(key_path):
        raise FileNotFoundError(f"{key_type.capitalize()} key not found at {key_path}. Please generate it first.")

    with open(key_path, "rb") as key_file:
        return RSA.import_key(key_file.read())
