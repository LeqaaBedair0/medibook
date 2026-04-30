import os
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from config import OPENROUTER_API_KEY, CHROMA_PATH

def main():
    # 1. Load data
    loader = DirectoryLoader('data', glob="*.txt", loader_cls=TextLoader)
    documents = loader.load()
    
    # 2. Split text
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_documents(documents)
    
    # 3. Create Vector Store
    db = Chroma.from_documents(
        chunks, 
        OpenAIEmbeddings(openai_api_key=OPENROUTER_API_KEY), 
        persist_directory=CHROMA_PATH
    )
    print(f"✅ Successfully ingested {len(chunks)} medical data chunks into {CHROMA_PATH}")

if __name__ == "__main__":
    main()
