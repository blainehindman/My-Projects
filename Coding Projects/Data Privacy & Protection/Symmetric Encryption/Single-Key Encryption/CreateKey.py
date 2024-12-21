import os
from cryptography.fernet import Fernet

# Generate and save the key in the script's directory
def generate_key():
    # Get the directory of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    key_path = os.path.join(script_dir, "key.key")

    # Generate the key
    key = Fernet.generate_key()
    with open(key_path, "wb") as key_file:
        key_file.write(key)

    print(f"Key generated and saved to: {key_path}")

# Call the function to generate the key
generate_key()
