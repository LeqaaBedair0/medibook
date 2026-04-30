import os
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from config import OPENROUTER_API_KEY

CHROMA_PATH = "/app/chroma_data"
DATA_PATH = "/app/data"

def main():
    # 1. Load your medical files
    loader = DirectoryLoader(DATA_PATH, glob="*.txt", loader_cls=TextLoader)
    documents = loader.load()
    
    # 2. Break them into chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=80)
    chunks = text_splitter.split_documents(documents)
    
    # 3. Create the Vector Store
    print(f"📖 Found {len(chunks)} chunks. Saving to {CHROMA_PATH}...")
    Chroma.from_documents(
        chunks, 
        OpenAIEmbeddings(openai_api_key=OPENROUTER_API_KEY), 
        persist_directory=CHROMA_PATH
    )
    print("✅ Database successfully populated!")

if __name__ == "__main__":
    main()
