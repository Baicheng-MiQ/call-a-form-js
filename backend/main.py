from fastapi import FastAPI, HTTPException
import subprocess

app = FastAPI()

@app.post("/dial/{phone_number}")
async def dial_number(phone_number: str):
    try:
        subprocess.run([
            "lk", "dispatch", "create",
            "--new-room",
            "--agent-name", "outbound-caller",
            "--metadata", phone_number
        ], check=True)
        return {"message": f"Dialing {phone_number}"}
    except subprocess.CalledProcessError:
        raise HTTPException(status_code=500, detail="Failed to initiate call")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9999)