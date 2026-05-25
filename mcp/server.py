#!/usr/bin/env python3
"""
Oce MCP Server — Jembatan Antigravity ↔ OpenClaw (Oce)
Antigravity bisa panggil Oce sebagai tool: chat, VPS ops, web search, delegasi Hermes.
"""

import json
import os
import asyncio
import httpx
import hmac
import hashlib
import time
from mcp.server.fastmcp import FastMCP

# === CONFIG ===
VPS_HOST = "217.216.109.145"
VPS_USER = "root"
VPS_PASSWORD = os.environ.get("VPS_PASSWORD", "c0VI4HvBzjp4hZ491F5pv9a1")
OCE_WEBHOOK = os.environ.get("OCE_WEBHOOK", "http://217.216.109.145:8644/webhooks/oce-task")
HERMES_WEBHOOK = os.environ.get("HERMES_WEBHOOK", "http://217.216.109.145:8644/webhooks/hermes-task")

mcp = FastMCP("oce-mcp", json_response=True)

# === SSH Helper ===
def ssh_exec(command, timeout=15):
    """Execute command on VPS via SSH."""
    try:
        import paramiko
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(VPS_HOST, username=VPS_USER, password=VPS_PASSWORD, timeout=10)
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        out = stdout.read().decode('utf-8', errors='replace')
        err = stderr.read().decode('utf-8', errors='replace')
        exit_code = stdout.channel.recv_exit_status()
        client.close()
        return {"stdout": out, "stderr": err, "code": exit_code}
    except Exception as e:
        return {"error": str(e)}

# === HTTP Helper ===
async def send_webhook(url, message, timeout=30):
    """Send message to Oce/Hermes webhook and get first response."""
    secret = b"oce-hermes-shared-secret-v1"
    payload = json.dumps({"text": message, "from": "antigravity"}).encode()
    sig = hmac.new(secret, payload, hashlib.sha256).hexdigest()

    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(url, content=payload, headers={
            "Content-Type": "application/json",
            "X-Hub-Signature-256": f"sha256={sig}"
        })
        return resp.text[:2000]

# === TOOLS ===

@mcp.tool()
def oce_chat(message: str, urgent: bool = False) -> str:
    """Kirim pesan ke Oce (AI assistant di VPS). Oce bisa bantu coding, riset, debugging, planning, dan eksekusi task.
    
    Args:
        message: Pesan yang mau dikirim ke Oce
        urgent: Tandai sebagai urgent (default False)
    """
    try:
        prefix = "URGENT: " if urgent else ""
        full_msg = f"[Antigravity] {prefix}{message}"
        # We can't await async in sync tool, use subprocess or httpx sync
        import httpx as httpx_sync
        secret = b"oce-hermes-shared-secret-v1"
        payload = json.dumps({"text": full_msg, "from": "antigravity"}).encode()
        sig = hmac.new(secret, payload, hashlib.sha256).hexdigest()
        
        with httpx_sync.Client(timeout=30) as client:
            resp = client.post(OCE_WEBHOOK, content=payload, headers={
                "Content-Type": "application/json",
                "X-Hub-Signature-256": f"sha256={sig}"
            })
            return f"📨 Pesan terkirim ke Oce: \"{message}\"\n\nStatus: {resp.status_code}\n\n💬 Oce akan merespon via Telegram atau agent reply."
    except Exception as e:
        return f"❌ Gagal kirim ke Oce: {str(e)}"


@mcp.tool()
def oce_vps_exec(command: str, timeout_sec: int = 15) -> str:
    """Eksekusi perintah shell di VPS (217.216.109.145). Untuk deploy, cek status, manage Docker, dll.
    
    Args:
        command: Perintah shell yang akan dijalankan di VPS
        timeout_sec: Timeout dalam detik (default 15)
    """
    result = ssh_exec(command, timeout=timeout_sec)
    if "error" in result:
        return f"❌ SSH Error: {result['error']}"
    
    text = f"```\n{result['stdout'][:3000]}\n```"
    if result.get('stderr'):
        text += f"\n\n⚠️ Stderr:\n```\n{result['stderr'][:1000]}\n```"
    if result.get('code') and result['code'] != 0:
        text += f"\n\nExit code: {result['code']}"
    return text


@mcp.tool()
def oce_vps_read_file(path: str, lines: int = 100) -> str:
    """Baca file dari VPS. Untuk cek config, log, atau source code di server.
    
    Args:
        path: Path absolut file di VPS
        lines: Jumlah baris terakhir yang dibaca (default 100)
    """
    result = ssh_exec(f"tail -n {lines} '{path}' 2>&1")
    if "error" in result:
        return f"❌ Error: {result['error']}"
    if result.get('code') and result['code'] != 0:
        return f"❌ File error: {result.get('stderr', 'not found')}"
    return f"📄 {path} (last {lines} lines):\n```\n{result['stdout'][:5000]}\n```"


@mcp.tool()
def oce_vps_write_file(path: str, content: str) -> str:
    """Tulis file ke VPS. Untuk deploy config, update code, atau bikin file baru.
    
    Args:
        path: Path absolut file di VPS
        content: Konten yang mau ditulis ke file
    """
    # Use base64 to avoid shell escaping issues
    import base64
    encoded = base64.b64encode(content.encode()).decode()
    result = ssh_exec(f"echo '{encoded}' | base64 -d > '{path}' && echo WRITE_OK")
    if "error" in result:
        return f"❌ Error: {result['error']}"
    return f"✅ File written to {path}\n```\n{result.get('stdout', 'OK')[:500]}\n```"


@mcp.tool()
def oce_deploy(message: str = "Update from Antigravity") -> str:
    """Deploy Portal Pembelajaran ke VPS. Build ulang dan update server di port 5173.
    
    Args:
        message: Deskripsi perubahan yang di-deploy
    """
    result = ssh_exec("cd /opt/learning-hub && bash start.sh && curl -s -o /dev/null -w '%{http_code}' http://localhost:5173/")
    if "error" in result:
        return f"❌ Deploy error: {result['error']}"
    return f"🚀 Deploy selesai: {message}\nServer: http://217.216.109.145:5173\nStatus: {result.get('stdout', '?')[:200]}"


@mcp.tool()
def oce_delegate_hermes(task: str) -> str:
    """Delegasikan task ke Hermes (Discord bot AI assistant). Hermes bisa bantu coding, browser automation, dan task paralel.
    
    Args:
        task: Task yang mau didelegasikan ke Hermes
    """
    try:
        import httpx as httpx_sync
        secret = b"oce-hermes-shared-secret-v1"
        payload = json.dumps({"text": task, "from": "antigravity-via-oce"}).encode()
        sig = hmac.new(secret, payload, hashlib.sha256).hexdigest()
        
        with httpx_sync.Client(timeout=10) as client:
            resp = client.post(HERMES_WEBHOOK, content=payload, headers={
                "Content-Type": "application/json",
                "X-Hub-Signature-256": f"sha256={sig}"
            })
            return f"📨 Task didelegasikan ke Hermes:\n> {task}\n\nStatus: {resp.status_code}\nHermes akan merespon via Discord."
    except Exception as e:
        return f"❌ Gagal delegasi ke Hermes: {str(e)}"


@mcp.tool()
def oce_status() -> str:
    """Cek status VPS, service, dan Portal Pembelajaran."""
    result = ssh_exec("echo '=== Docker ===' && docker ps --format 'table {{.Names}}\t{{.Status}}' 2>/dev/null | head -8 && echo && echo '=== Portal Pembelajaran ===' && curl -s -o /dev/null -w 'HTTP %{http_code}' http://localhost:5173/ 2>/dev/null && echo && echo '=== Disk ===' && df -h / | tail -1")
    if "error" in result:
        return f"❌ Error: {result['error']}"
    return f"📊 VPS Status:\n```\n{result['stdout'][:3000]}\n```"


# === MAIN ===
if __name__ == "__main__":
    mcp.run(transport="stdio")
