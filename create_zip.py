import zipfile
import os

dist_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend', 'dist')
workspace_zip = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public_html.zip')
desktop_zip = r'c:\Users\marlin\OneDrive\Desktop\public_html.zip'

targets = [workspace_zip, desktop_zip]

for zip_path in targets:
    try:
        if os.path.exists(zip_path):
            os.remove(zip_path)

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(dist_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, dist_dir).replace('\\', '/')
                    zipf.write(file_path, rel_path)

        print(f"Created {zip_path} successfully with Linux-compatible forward-slash paths.")
    except Exception as e:
        print(f"Notice: Could not write to {zip_path}: {e}")
