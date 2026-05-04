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
from livekit.agents import AgentSession, Agent, RoomInputOptions, inference
from livekit.plugins import silero

# Load LiveKit credentials from .env.local
load_dotenv(".env.local")


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
- Don't use complex formatting, emojis, or special characters
- If you don't know something specific about their order, let them know you'll 
  connect them with a specialist or suggest they check their order status in their profile
- Always be polite and end interactions by asking if there's anything else you can help with
- Introduce yourself as "ShopVault Support" when greeting the customer

Remember: You are speaking, not typing. Keep it natural and brief.""",
        )


async def entrypoint(ctx: agents.JobContext):
    """Entry point for the voice agent — called when a user joins a room."""

    # Create the voice agent session with LiveKit Inference models
    session = AgentSession(
        stt=inference.STT(model="deepgram/nova-3"),
        llm=inference.LLM(model="openai/gpt-4o-mini"),
        tts=inference.TTS(
            model="cartesia/sonic-2",
            voice="b7d50908-b17c-442d-ad8d-810c63997ed9",  # Default friendly voice
        ),
        vad=silero.VAD.load(),
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
