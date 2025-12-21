import urllib.request
import ssl

url = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
output_path = "public/world-110m.json"

# Create an unverified context to avoid SSL errors if certificates are missing
context = ssl._create_unverified_context()

try:
    with urllib.request.urlopen(url, context=context) as response:
        data = response.read()
        with open(output_path, "wb") as f:
            f.write(data)
    print("Download successful")
except Exception as e:
    print(f"Download failed: {e}")
