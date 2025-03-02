from __future__ import annotations

import asyncio
import logging
from dotenv import load_dotenv
import json
import os
from time import perf_counter
from typing import Annotated, Literal, List
from livekit import rtc, api
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    llm,
)
from livekit.agents.multimodal import MultimodalAgent
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.plugins import deepgram, openai, silero


# load environment variables, this is optional, only used for local development
load_dotenv(dotenv_path=".env.local")
logger = logging.getLogger("outbound-caller")
logger.setLevel(logging.INFO)

outbound_trunk_id = os.getenv("SIP_OUTBOUND_TRUNK_ID")
_default_instructions = (
    "You help users with forms. "
    "Ask questions one by one to guide them and use functions to fill answers." 
    "Fix the conversation if it goes off-topic or the user is unresponsive. "
    "Speak with a natural and warm voice, like a real human surveyor. "
    "Start by saying hello, and introduce yourself and the form."
    "Ask user to confirm continue and tell them this call may be monitored or recorded."
    "You only provide answers by function call by the end of the conversation."
    "If conversation ends without sufficient information, don't call fill form functions."
)


async def entrypoint(ctx: JobContext):
    global _default_instructions, outbound_trunk_id
    logger.info(f"connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    user_identity = "phone_user"
    # the phone number to dial is provided in the job metadata
    phone_number = ctx.job.metadata
    logger.info(f"dialing {phone_number} to room {ctx.room.name}")

    # look up the user's phone number and appointment details
    instructions = (
        _default_instructions + 
        """
        {
    "title": "Computer Science Open Days registration",
    "description": "UCL Computer Science is recognised as a world leader in teaching and research, and our undergraduate degree programmes are designed and taught by world-class researchers, ensuring our material is cutting-edge.\n\nWe are excited to welcome you to the UCL undergraduate Open Days page! You can find out about future events, programmes and subjects that interest you.\n\nIf you cannot attend, You are welcome to visit UCL on any weekday between 10am–4pm and follow our self-guided tour. Prospectuses and copies of the self-guided tour booklet are available from the Front Lodge on the right-hand side of the UCL gates on Gower Street (WC1E 6BT)\n\nEvent Timing: January 4th-6th, \nUniversity College London, Gower Street, London, WC1E 6BT Tel: +44 (0) 20 7679 2000",
    "questions": [
        {
            "id": 2092238618,
            "title": "Name",
            "required": true,
            "type": "TEXT",
            "options": []
        },
        {
            "id": 1556369182,
            "title": "Email",
            "required": true,
            "type": "TEXT",
            "options": []
        },
        {
            "id": 479301265,
            "title": "High school from",
            "required": true,
            "type": "TEXT",
            "options": []
        },
        {
            "id": 479559868,
            "title": "Which other faculty or subject are you interested in?",
            "required": true,
            "type": "TEXT",
            "options": []
        },
        {
            "id": 1753222212,
            "title": "What days will you attend?",
            "required": true,
            "type": "CHECKBOX",
            "options": [
                {
                    "value": "Day 1"
                },
                {
                    "value": "Day 2"
                },
                {
                    "value": "Day 3"
                }
            ]
        },
        {
            "id": 588393791,
            "title": "Dietary restrictions",
            "required": true,
            "type": "RADIO",
            "options": [
                {
                    "value": "None"
                },
                {
                    "value": "Vegetarian"
                },
                {
                    "value": "Vegan"
                },
                {
                    "value": "Kosher"
                },
                {
                    "value": "Gluten-free"
                },
                {
                    "isOther": true
                }
            ]
        },
        {
            "id": 2109138769,
            "title": "I understand that I will have to pay 5 pounds upon arrival for admin purposes.",
            "required": true,
            "type": "CHECKBOX",
            "options": [
                {
                    "value": "Yes"
                }
            ]
        }
    ]
}
        """
    )

    # `create_sip_participant` starts dialing the user
    await ctx.api.sip.create_sip_participant(
        api.CreateSIPParticipantRequest(
            room_name=ctx.room.name,
            sip_trunk_id=outbound_trunk_id,
            sip_call_to=phone_number,
            participant_identity=user_identity,
        )
    )

    # a participant is created as soon as we start dialing
    participant = await ctx.wait_for_participant(identity=user_identity)

    # start the agent, either a VoicePipelineAgent or MultimodalAgent
    # this can be started before the user picks up. The agent will only start
    # speaking once the user answers the call.
    # run_voice_pipeline_agent(ctx, participant, instructions)
    run_multimodal_agent(ctx, participant, instructions)

    # in addition, you can monitor the call status separately
    start_time = perf_counter()
    while perf_counter() - start_time < 30:
        call_status = participant.attributes.get("sip.callStatus")
        if call_status == "active":
            logger.info("user has picked up")
            return
        elif call_status == "automation":
            # if DTMF is used in the `sip_call_to` number, typically used to dial
            # an extension or enter a PIN.
            # during DTMF dialing, the participant will be in the "automation" state
            pass
        elif participant.disconnect_reason == rtc.DisconnectReason.USER_REJECTED:
            logger.info("user rejected the call, exiting job")
            break
        elif participant.disconnect_reason == rtc.DisconnectReason.USER_UNAVAILABLE:
            logger.info("user did not pick up, exiting job")
            break
        await asyncio.sleep(0.1)

    logger.info("session timed out, exiting job")
    ctx.shutdown()


class CallActions(llm.FunctionContext):
    """
    Detect user intent and perform actions
    """

    def __init__(
        self, *, api: api.LiveKitAPI, participant: rtc.RemoteParticipant, room: rtc.Room
    ):
        super().__init__()

        self.api = api
        self.participant = participant
        self.room = room

    async def hangup(self):
        try:
            await self.api.room.remove_participant(
                api.RoomParticipantIdentity(
                    room=self.room.name,
                    identity=self.participant.identity,
                )
            )
        except Exception as e:
            # it's possible that the user has already hung up, this error can be ignored
            logger.info(f"received error while ending call: {e}")

    @llm.ai_callable()
    async def end_call(self):
        """Called when the user wants to end the call"""
        logger.info(f"ending the call for {self.participant.identity}")
        await self.hangup()


    @llm.ai_callable()
    def generate_google_form(
        self,
        name: Annotated[str, "Name"],
        email: Annotated[str, "Email"],
        high_school_from: Annotated[str, "High school from"],
        which_faculty_or_subject_interested: Annotated[str, "Which faculty or subject interested"],
        what_days_will_you_attend: Annotated[List[str], "What days will you attend?"],
        dietary_restrictions: Annotated[str, "Dietary restrictions"],
        i_understand_that_i_will_have_to_pay_upon_arrival: Annotated[str, "I understand that I will have to pay 5 pounds upon arrival"]
    ) -> str:
        """Called when the user has filled the form. Use this tool to fill the form."""
        import requests
        
        # Construct form URL with parameters
        base_url = "https://docs.google.com/forms/d/e/1FAIpQLSeL1CVV7cgVjRi-jABbYR_xTjbbt1hnQc24nSG8UuLT4JUa-g/formResponse"
        params = {
            'entry.2092238618': name,
            'entry.1556369182': email,
            'entry.479301265': high_school_from,
            'entry.479559868': which_faculty_or_subject_interested,
            'entry.1753222212': what_days_will_you_attend,
            'entry.588393791': dietary_restrictions,
            'entry.2109138769': i_understand_that_i_will_have_to_pay_upon_arrival
        }
        
        try:
            response = requests.post(base_url, data=params)
            if response.status_code:  # Google Forms typically returns 302
                print(f"Form submitted successfully: {name}, {email}, {what_days_will_you_attend}, {dietary_restrictions}, {i_understand_that_i_will_have_to_pay_upon_arrival}")
                return "Form submitted successfully"
            else:
                return f"Form submission failed with status code: {response.status_code}"
        except Exception as e:
            return f"Error submitting form: {str(e)}"

    @llm.ai_callable()
    async def detected_answering_machine(self):
        """Called when the call reaches voicemail. Use this tool AFTER you hear the voicemail greeting"""
        logger.info(f"detected answering machine for {self.participant.identity}")
        await self.hangup()


def run_multimodal_agent(
    ctx: JobContext, participant: rtc.RemoteParticipant, instructions: str
):
    logger.info("starting multimodal agent")

    model = openai.realtime.RealtimeModel(
        instructions=instructions,
        modalities=["audio", "text"],
    )
    agent = MultimodalAgent(
        model=model,
        fnc_ctx=CallActions(api=ctx.api, participant=participant, room=ctx.room),
    )
    agent.start(ctx.room, participant)


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


if __name__ == "__main__":
    if not outbound_trunk_id or not outbound_trunk_id.startswith("ST_"):
        raise ValueError(
            "SIP_OUTBOUND_TRUNK_ID is not set. Please follow the guide at https://docs.livekit.io/agents/quickstarts/outbound-calls/ to set it up."
        )
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            # giving this agent a name will allow us to dispatch it via API
            # automatic dispatch is disabled when `agent_name` is set
            agent_name="outbound-caller",
            # prewarm by loading the VAD model, needed only for VoicePipelineAgent
            prewarm_fnc=prewarm,
        )
    )
