import zipfile
import os

dist_dir = r'c:\Users\marlin\OneDrive\Desktop\workss\vairavan_koil_app\frontend\dist'
zip_path = r'c:\Users\marlin\OneDrive\Desktop\public_html.zip'

if os.path.exists(zip_path):
    os.remove(zip_path)

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(dist_dir):
        for file in files:
            file_path = os.path.join(root, file)
            # Ensure Linux/Hostinger compatible forward slash path
            rel_path = os.path.relpath(file_path, dist_dir).replace('\\', '/')
            zipf.write(file_path, rel_path)

print(f"Created {zip_path} successfully with Linux-compatible forward-slash paths.")
