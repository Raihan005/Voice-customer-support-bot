import os
import sys
import logging
from dotenv import load_dotenv
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, StorageContext
from llama_index.vector_stores.postgres import PGVectorStore
from llama_index.embeddings.gemini import GeminiEmbedding
from llama_index.core import Settings
from sqlalchemy import make_url

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(".env.local")
load_dotenv("../backend/.env")

# Set up the embedding model
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    logger.error("GEMINI_API_KEY environment variable not found. Please set it in .env.local")
    sys.exit(1)

# Gemini embedding-001 has dimension 768
Settings.embed_model = GeminiEmbedding(model_name="gemini-embedding-2", api_key=api_key)

def ingest_policies():
    policies_dir = "./policies"
    if not os.path.exists(policies_dir):
        logger.error(f"Directory {policies_dir} does not exist.")
        sys.exit(1)
        
    documents = SimpleDirectoryReader(policies_dir).load_data()
    if not documents:
        logger.warning(f"No documents found in {policies_dir}.")
        return

    # Database connection parameters
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "shopvault")
    db_user = os.getenv("DB_USER", "shopvault_user")
    db_password = os.getenv("DB_PASSWORD", "shopvault_secret_2024")

    # Set up Postgres vector store
    # PGVectorStore automatically creates the extension and table if they don't exist
    vector_store = PGVectorStore.from_params(
        database=db_name,
        host=db_host,
        password=db_password,
        port=db_port,
        user=db_user,
        table_name="company_policies_v2",
        embed_dim=3072  # Updated to match the new embedding model
    )

    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    logger.info(f"Ingesting {len(documents)} documents from {policies_dir} into PostgreSQL...")
    index = VectorStoreIndex.from_documents(
        documents,
        storage_context=storage_context,
        show_progress=True
    )
    logger.info("Ingestion complete!")

if __name__ == "__main__":
    ingest_policies()
