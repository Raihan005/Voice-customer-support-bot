"""
ShopVault Voice AI Support Agent

A LiveKit-powered voice agent that serves as a customer support
representative for the ShopVault e-commerce platform.

Uses LiveKit Inference for all AI models:
  - STT: Deepgram Nova 3
  - LLM: OpenAI GPT-4o-mini
  - TTS: Cartesia Sonic 2
  - VAD: Silero (local)
"""

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions, inference, llm
from livekit.plugins import silero
import asyncpg
import os
import logging

# Load LiveKit credentials from .env.local
load_dotenv(".env.local")
# Try to load backend database credentials as well if they exist
load_dotenv("../backend/.env")


class ShopVaultAssistant(Agent):
    """Voice AI assistant for ShopVault customer support."""

    def __init__(self) -> None:
        super().__init__(
            instructions="""You are a friendly and professional customer support agent for ShopVault, 
an online e-commerce store that sells electronics, accessories, and lifestyle products.

Your role:
- Help customers with order inquiries, shipping questions, returns, and refunds
- Provide product information and recommendations
- Troubleshoot any issues with their shopping experience
- Be empathetic, patient, and solution-oriented

Guidelines:
- Keep responses concise and conversational (this is a voice call, not text)
- IMPORTANT: Avoid filler words and conversational crutches such as "great choice", "let's do that", "I see", "ok", or "sure". Be direct and professional.
- Don't use complex formatting, emojis, or special characters
- If you don't know something specific about their order, let them know you'll 
  connect them with a specialist or suggest they check their order status in their profile
- Always be polite and end interactions by asking if there's anything else you can help with
- Introduce yourself as "ShopVault Support" when greeting the customer

Remember: You are speaking, not typing. Keep it natural and brief.""",
        )

class ShopVaultFncCtx:
    def __init__(self, user_id: str):
        super().__init__()
        self.user_id = user_id

    async def _get_db_pool(self):
        return await asyncpg.create_pool(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5432")),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD")
        )

    @llm.function_tool(description="Retrieves the profile information of the current customer, including their name and email.")
    async def get_user_info(self):
        if not self.user_id:
            return "User not found or not authenticated."
        
        try:
            pool = await self._get_db_pool()
            async with pool.acquire() as conn:
                row = await conn.fetchrow("SELECT name, email FROM users WHERE id = $1", self.user_id)
            await pool.close()
            
            if row:
                return f"Customer Name: {row['name']}, Email: {row['email']}"
            else:
                return "Could not find the user profile in the database."
        except Exception as e:
            logging.error(f"Error fetching user info: {e}")
            return f"Error retrieving user information."

    @llm.function_tool(description="Retrieves the most recent orders placed by the current customer, including order ID, status, total amount, and items.")
    async def get_recent_orders(self):
        if not self.user_id:
            return "User not found or not authenticated."
            
        try:
            pool = await self._get_db_pool()
            async with pool.acquire() as conn:
                orders = await conn.fetch("SELECT id, total, status, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 3", self.user_id)
                
                if not orders:
                    await pool.close()
                    return "The customer has no recent orders."
                
                result = []
                for order in orders:
                    items = await conn.fetch("SELECT product_name, quantity, unit_price FROM order_items WHERE order_id = $1", order['id'])
                    items_str = ", ".join([f"{i['quantity']}x {i['product_name']} (${i['unit_price']})" for i in items])
                    result.append(f"Order ID: {order['id']}, Status: {order['status']}, Total: ${order['total']}, Date: {order['created_at'].strftime('%Y-%m-%d')}, Items: {items_str}")
            await pool.close()
            
            return "\\n".join(result)
        except Exception as e:
            logging.error(f"Error fetching orders: {e}")
            return f"Error retrieving order information."

    @llm.function_tool(description="Searches company policies to answer customer questions about returns, shipping, warranty, etc.")
    async def query_company_policies(self, question: str):
        try:
            db_host = os.getenv("DB_HOST")
            db_port = os.getenv("DB_PORT")
            db_name = os.getenv("DB_NAME")
            db_user = os.getenv("DB_USER")
            db_password = os.getenv("DB_PASSWORD")
            api_key = os.getenv("GEMINI_API_KEY")
            
            from llama_index.core import Settings
            from llama_index.embeddings.gemini import GeminiEmbedding
            from llama_index.vector_stores.postgres import PGVectorStore
            from llama_index.core import VectorStoreIndex
            
            Settings.embed_model = GeminiEmbedding(model_name="gemini-embedding-2", api_key=api_key)
            
            vector_store = PGVectorStore.from_params(
                database=db_name,
                host=db_host,
                password=db_password,
                port=db_port,
                user=db_user,
                table_name="company_policies_v2",
                embed_dim=3072
            )
            index = VectorStoreIndex.from_vector_store(vector_store=vector_store)
            retriever = index.as_retriever(similarity_top_k=2)
            nodes = await retriever.aretrieve(question)
            
            if not nodes:
                return "No relevant policy information found."
                
            policy_text = "\n\n".join([node.get_content() for node in nodes])
            return f"Relevant Policy Information:\n{policy_text}"
        except Exception as e:
            logging.error(f"Error querying policies: {e}")
            return "Sorry, I couldn't retrieve the policy information at the moment."




async def entrypoint(ctx: agents.JobContext):
    """Entry point for the voice agent — called when a user joins a room."""

    # Extract user ID from participant identity
    await ctx.connect()
    
    user_id = None
    for participant in ctx.room.remote_participants.values():
        if participant.identity.startswith("user-"):
            user_id = participant.identity.replace("user-", "")
            break
            
    fnc_ctx = ShopVaultFncCtx(user_id=user_id) if user_id else None

    # Create the voice agent session with LiveKit Inference models
    session = AgentSession(
        stt=inference.STT(model="deepgram/nova-3"),
        llm=inference.LLM(model="openai/gpt-4o-mini"),
        tts=inference.TTS(
            model="cartesia/sonic-2",
            voice="b7d50908-b17c-442d-ad8d-810c63997ed9",  # Default friendly voice
        ),
        vad=silero.VAD.load(),
        tools=llm.find_function_tools(fnc_ctx) if fnc_ctx else [],
    )

    # Start the session — agent joins the room and begins listening
    await session.start(
        room=ctx.room,
        agent=ShopVaultAssistant(),
    )

    # Greet the customer
    await session.generate_reply(
        instructions="Greet the customer warmly. Introduce yourself as ShopVault Support and ask how you can help them today."
    )


if __name__ == "__main__":
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
