import os
from dotenv import load_dotenv



# تحميل المتغيرات من .env
load_dotenv(override=True)

# قراءة المفتاح
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# اختبار التحقق (سيظهر لك عند تشغيل config.py فقط)
if OPENROUTER_API_KEY:
    print(f"✅ API Key loaded in config.py (Length: {len(OPENROUTER_API_KEY.strip())})")
else:
    print(("❌ API Key NOT found in config.py!").env)

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, "medibook.db")


if os.path.exists("/.dockerenv"):
    CHROMA_PATH = "/app/chroma_data"
else:
    CHROMA_PATH = os.getenv("CHROMA_PATH", r'D:\cli\data')

print(f"--- Configuration Loaded ---")
print(f"Database Path: {DATABASE_PATH}")
print(f"ChromaDB Path: {CHROMA_PATH}")