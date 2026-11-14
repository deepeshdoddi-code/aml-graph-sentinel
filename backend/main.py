import json
import os
import subprocess
from http.server import BaseHTTPRequestHandler, HTTPServer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "data")
CPP_DIR = os.path.join(BASE_DIR, "..", "cpp_engine")
MOCK_JSON = os.path.join(DATA_DIR, "mock_alerts.json")
LIVE_JSON = os.path.join(DATA_DIR, "live_output.json")
CSV_PATH = os.path.join(DATA_DIR, "transactions.csv")
EXE_WIN = os.path.join(CPP_DIR, "aml_sentinel.exe")
EXE_LINUX = os.path.join(CPP_DIR, "aml_sentinel")


def ensure_csv_exists():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(CSV_PATH):
        rows = [
            "tx_id,src,dst,amount,timestamp,time_label,is_laundering",
            "TX_8001,ACC_104,ACC_389,50000.0,1731560000,10:00 AM,1",
            "TX_8044,ACC_389,ACC_712,49250.0,1731563600,11:00 AM,1",
            "TX_8092,ACC_712,ACC_501,48700.0,1731568100,12:15 PM,1",
            "TX_8150,ACC_501,ACC_104,48200.0,1731571700,01:15 PM,1",
            "TX_7101,ACC_201,ACC_900,9500.0,1731575000,02:10 PM,1",
            "TX_7105,ACC_202,ACC_900,9400.0,1731575600,02:20 PM,1",
            "TX_7112,ACC_203,ACC_900,9600.0,1731576200,02:30 PM,1",
            "TX_7118,ACC_204,ACC_900,9700.0,1731576800,02:40 PM,1",
            "TX_7190,ACC_900,ACC_999,37400.0,1731580100,03:35 PM,1",
            "TX_6011,ACC_410,ACC_615,30000.0,1731582000,04:00 PM,1",
            "TX_6019,ACC_615,ACC_822,29400.0,1731583200,04:20 PM,1",
            "TX_6028,ACC_822,ACC_930,28950.0,1731584520,04:42 PM,1",
        ]
        for i in range(1, 36):
            amt = 14500.0 + (i * 200)
            ts = 1731500000 + (i * 600)
            rows.append(f"TX_NORM_{i},CORP_{i},VENDOR_{i},{amt},{ts},09:00 AM,0")
        with open(CSV_PATH, "w", encoding="utf-8") as f:
            f.write("\n".join(rows) + "\n")


def load_payload():
    if os.path.exists(LIVE_JSON):
        with open(LIVE_JSON, "r", encoding="utf-8") as f:
            return json.load(f)
    if os.path.exists(MOCK_JSON):
        with open(MOCK_JSON, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"engine_status": "OFFLINE", "alerts": []}


def run_cpp_engine():
    ensure_csv_exists()
    if os.path.exists(EXE_WIN):
        subprocess.run([EXE_WIN, CSV_PATH, LIVE_JSON], check=False)
    elif os.path.exists(EXE_LINUX):
        subprocess.run(
            ["wsl", "./aml_sentinel", "../data/transactions.csv", "../data/live_output.json"],
            cwd=CPP_DIR,
            check=False,
        )
    return load_payload()


class AMLHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
        self._send_cors_headers()

    def do_GET(self):
        if self.path.startswith("/api/alerts"):
            self._send_cors_headers()
            self.wfile.write(json.dumps(load_payload()).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path.startswith("/api/scan"):
            self._send_cors_headers()
            data = run_cpp_engine()
            self.wfile.write(json.dumps(data).encode("utf-8"))
        elif self.path.startswith("/api/inject"):
            ensure_csv_exists()
            injected_ring = [
                "TX_9901,ACC_777,ACC_881,65000.0,1731590000,06:10 PM,1",
                "TX_9902,ACC_881,ACC_882,64100.0,1731591200,06:30 PM,1",
                "TX_9903,ACC_882,ACC_777,63400.0,1731592400,06:50 PM,1",
            ]
            with open(CSV_PATH, "a", encoding="utf-8") as f:
                f.write("\n".join(injected_ring) + "\n")
            self._send_cors_headers()
            data = run_cpp_engine()
            self.wfile.write(json.dumps(data).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()


if __name__ == "__main__":
    ensure_csv_exists()
    server = HTTPServer(("0.0.0.0", 8000), AMLHandler)
    print("[AML-Sentinel Backend] Listening on http://127.0.0.1:8000")
    server.serve_forever()