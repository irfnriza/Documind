import requests
import time

print('Uploading document...')
files={'file': open('sample_document.docx', 'rb')}
r1=requests.post('http://localhost:8000/api/ingest', files=files)
print('Ingest Status:', r1.status_code)

if r1.status_code == 200:
    session_id = r1.json().get('session_id')
    print('Session ID:', session_id)
    time.sleep(2)
    print('Querying document...')
    r2=requests.post('http://localhost:8000/api/query', json={'session_id': session_id, 'question': 'Berapa hari cuti tahunan yang didapatkan karyawan?'})
    print('Query Status:', r2.status_code)
    if r2.status_code == 200:
        print('Answer:', r2.json().get('answer'))
        print('Sources count:', len(r2.json().get('sources', [])))
    else:
        print(r2.text)
else:
    print(r1.text)
