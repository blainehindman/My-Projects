import os

def create_keyvault():
    """Create a KeyVault directory to store unique encryption keys for each user."""
    # Get the script's directory
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Define the KeyVault directory path
    keyvault_dir = os.path.join(script_dir, "KeyVault")

    # Check if the directory exists, if not, create it
    if not os.path.exists(keyvault_dir):
        os.makedirs(keyvault_dir)
        print(f"KeyVault directory created at: {keyvault_dir}")
    else:
        print(f"KeyVault directory already exists at: {keyvault_dir}")

    return keyvault_dir

if __name__ == "__main__":
    # Call the function to ensure KeyVault is created
    create_keyvault()
