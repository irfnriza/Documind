"""Test the full ingest → query flow against the new MongoDB-backed API."""
import requests
import time

print("=== DocuMind Serverless API Test ===\n")

# 1. Health check
print("1. Health check...")
r = requests.get("http://localhost:8000/")
print(f"   Status: {r.status_code}")
print(f"   Response: {r.json()}\n")

# 2. Test Legal Analyzer (stateless, no MongoDB needed)
print("2. Legal Analyzer...")
r = requests.post("http://localhost:8000/api/analyze", json={
    "text": "Penyewa wajib membayar denda 10% per hari jika terlambat membayar sewa.",
    "mode": "legal",
})
print(f"   Status: {r.status_code}")
if r.status_code == 200:
    data = r.json()
    print(f"   Risk Score: {data.get('risk_score')}")
    print(f"   Clauses: {data.get('total_clauses')}")
else:
    print(f"   Error: {r.text}")

# 3. Test Document Chat (ingest → query, needs MongoDB)
print("\n3. Document Ingest...")
files = {'file': ('test.docx', open('sample_document.docx', 'rb'))}
r = requests.post("http://localhost:8000/api/ingest", files=files)
print(f"   Status: {r.status_code}")
if r.status_code == 200:
    data = r.json()
    session_id = data.get('session_id')
    print(f"   Session ID: {session_id}")
    print(f"   Chunks: {data.get('chunks')}")

    time.sleep(1)

    print("\n4. Document Query...")
    r = requests.post("http://localhost:8000/api/query", json={
        "session_id": session_id,
        "question": "Berapa hari cuti tahunan karyawan?"
    })
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"   Answer: {data.get('answer')}")
        print(f"   Sources: {len(data.get('sources', []))}")
        print(f"   Latency: {data.get('latency_ms')}ms")
    else:
        print(f"   Error: {r.text}")
else:
    print(f"   Error: {r.text}")

print("\n=== Test Complete ===")
