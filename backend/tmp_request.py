import requests
url = 'http://localhost:8000/api/sites/a09662ab-b084-4393-9086-0be5521bafa2/features'
payload = {'start_date': '2025-10-01', 'end_date': '2025-10-31'}
res = requests.post(url, json=payload)
print(res.status_code)
print(res.text)
