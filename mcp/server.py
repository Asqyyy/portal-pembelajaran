#!/usr/bin/env python3
"""
Oce MCP Server — Jembatan Antigravity ↔ OpenClaw (Oce)
Antigravity bisa panggil Oce sebagai tool: chat, VPS ops, web search, delegasi Hermes.
"""

import json
import os
import subprocess
import asyncio
import httpx
from mcp.server import Server, NotificationOptions
from mcp.server.models import InitializationCapabilities
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# === CONFIG ===
VPS_HOST = "217.216.109.145"
VPS_USER = "root"
VPS_PASSWORD = os.environ.get("VPS_PASSWORD", "c0VI4H…v9a1")
OCE_WEBHOOK = os.environ.get("OCE_WEBHOOK", "http://217.216.109.145:8644/webhooks/oce-task")
HERMES_WEBHOOK = os.environ.get("HERMES_WEBHOOK", "http://217.216.109.145:8644/webhooks/hermes-task")
GATEWAY_URL = os.environ.get("GATEWAY_URL", "http://217.216.109.145:18789")

server = Server("oce-mcp")

# === SSH Helper ===
def ssh_exec(command, timeout=15):
    """Execute command on VPS via SSH."""
    import paramiko
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(VPS_HOST, username=VPS_USER, password=VPS_PASSWORD, timeout=10)
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        out = stdout.read().decode('utf-8', errors='replace')
        err = stderr.read().decode('utf-8', errors='replace')
        return {"stdout": out, "stderr": err, "code": stdout.channel.recv_exit_status()}
    except Exception as e:
        return {"error": str(e)}
    finally:
        client.close()

# === HTTP Helper ===
async def send_webhook(url, message, timeout=30):
    """Send message to Oce/Hermes webhook and get response."""
    import hmac, hashlib, time
    secret = b"oce-hermes-shared-secret-v1"
    payload = json.dumps({"text": message, "from": "antigravity"}).encode()
    sig = hmac.new(secret, payload, hashlib.sha256).hexdigest()
    
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(url, content=payload, headers={
            "Content-Type": "application/json",
            "X-Hub-Signature-256": f"sha256={sig}"
        })
        return resp.text

# === TOOL DEFINITIONS ===
@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="oce_chat",
            description="Kirim pesan ke Oce (AI assistant di VPS). Oce bisa bantu coding, riset, debugging, planning, dan eksekusi task. Gunakan untuk minta bantuan teknis, brainstorming, atau delegasi pekerjaan.",
            inputSchema={
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "Pesan yang mau dikirim ke Oce"},
                    "urgent": {"type": "boolean", "description": "Tandai sebagai urgent untuk respon lebih cepat", "default": False}
                },
                "required": ["message"]
            }
        ),
        Tool(
            name="oce_vps_exec",
            description="Eksekusi perintah shell di VPS (217.216.109.145). Bisa untuk deploy, cek status, manage Docker, dll.",
            inputSchema={
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "Perintah shell yang akan dijalankan di VPS"},
                    "timeout": {"type": "integer", "description": "Timeout dalam detik", "default": 15}
                },
                "required": ["command"]
            }
        ),
        Tool(
            name="oce_vps_read_file",
            description="Baca file dari VPS. Berguna untuk cek config, log, atau source code di server.",
            inputSchema={
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Path absolut file di VPS"},
                    "lines": {"type": "integer", "description": "Jumlah baris terakhir yang dibaca", "default": 100}
                },
                "required": ["path"]
            }
        ),
        Tool(
            name="oce_vps_write_file",
            description="Tulis file ke VPS. Berguna untuk deploy config, update code, atau bikin file baru di server.",
            inputSchema={
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Path absolut file di VPS"},
                    "content": {"type": "string", "description": "Konten yang mau ditulis ke file"}
                },
                "required": ["path", "content"]
            }
        ),
        Tool(
            name="oce_deploy",
            description="Deploy Portal Pembelajaran ke VPS. Build ulang dan update server di port 5173.",
            inputSchema={
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "Deskripsi perubahan yang di-deploy", "default": "Update from Antigravity"}
                }
            }
        ),
        Tool(
            name="oce_delegate_hermes",
            description="Delegasikan task ke Hermes (Discord bot AI assistant). Hermes bisa bantu coding, browser automation, dan task paralel.",
            inputSchema={
                "type": "object",
                "properties": {
                    "task": {"type": "string", "description": "Task yang mau didelegasikan ke Hermes"},
                },
                "required": ["task"]
            }
        ),
    ]

# === TOOL HANDLERS ===
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    try:
        if name == "oce_chat":
            msg = arguments["message"]
            result = await send_webhook(OCE_WEBHOOK, msg)
            return [TextContent(type="text", text=f"📨 Pesan terkirim ke Oce.\n\n💬 Respon: {result[:2000] if result else '(Oce akan merespon — cek Telegram untuk jawaban lengkap)'}")]

        elif name == "oce_vps_exec":
            cmd = arguments["command"]
            timeout = arguments.get("timeout", 15)
            result = ssh_exec(cmd, timeout=timeout)
            if "error" in result:
                return [TextContent(type="text", text=f"❌ SSH Error: {result['error']}")]
            text = f"```\n{result['stdout'][:3000]}\n```"
            if result.get('stderr'):
                text += f"\n\n⚠️ Stderr:\n```\n{result['stderr'][:1000]}\n```"
            if result.get('code') and result['code'] != 0:
                text += f"\n\nExit code: {result['code']}"
            return [TextContent(type="text", text=text)]

        elif name == "oce_vps_read_file":
            path = arguments["path"]
            lines = arguments.get("lines", 100)
            result = ssh_exec(f"tail -n {lines} '{path}' 2>&1")
            if "error" in result:
                return [TextContent(type="text", text=f"❌ Error: {result['error']}")]
            if result.get('code') and result['code'] != 0:
                return [TextContent(type="text", text=f"❌ File error: {result.get('stderr', 'not found')}")]
            return [TextContent(type="text", text=f"📄 {path} (last {lines} lines):\n```\n{result['stdout'][:5000]}\n```")]

        elif name == "oce_vps_write_file":
            path = arguments["path"]
            content = arguments["content"]
            # Escape content for shell
            encoded = content.replace("'", "'\"'\"'")
            result = ssh_exec(f"cat > '{path}' << 'OCE_EOF'\n{content}\nOCE_EOF && echo WRITE_OK")
            if "error" in result:
                return [TextContent(type="text", text=f"❌ Error: {result['error']}")]
            return [TextContent(type="text", text=f"✅ File written to {path}\n```\n{result.get('stdout', 'OK')[:500]}\n```")]

        elif name == "oce_deploy":
            msg = arguments.get("message", "Update from Antigravity")
            # Trigger deploy on VPS
            ssh_exec("cd /opt/learning-hub && bash start.sh")
            return [TextContent(type="text", text=f"🚀 Deploy triggered: {msg}\nServer running at http://217.216.109.145:5173\nCheck Portal Pembelajaran for updates.")]

        elif name == "oce_delegate_hermes":
            task = arguments["task"]
            await send_webhook(HERMES_WEBHOOK, task)
            return [TextContent(type="text", text=f"📨 Task didelegasikan ke Hermes:\n\n> {task}\n\nHermes akan merespon via Discord atau webhook.")]

        else:
            return [TextContent(type="text", text=f"Unknown tool: {name}")]

    except Exception as e:
        return [TextContent(type="text", text=f"❌ Error: {str(e)}")]

# === MAIN ===
async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationCapabilities(
                sampling={},
                experimental={},
            ),
        )

if __name__ == "__main__":
    asyncio.run(main())
