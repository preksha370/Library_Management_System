import requests
from datetime import datetime

BASE = "http://127.0.0.1:5000/api"

# --------------------------
# Test 1: Register user
# --------------------------
user_data = {
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "password123",
    "role": "member"
}
r = requests.post(f"{BASE}/auth/register", json=user_data)
if r.status_code == 201:
    print("✅ Test user registered")
else:
    print(f"⚠️ Could not register user: {r.json().get('message')}")

# --------------------------
# Test 2: Login user
# --------------------------
login_data = {"email": user_data["email"], "password": user_data["password"]}
r = requests.post(f"{BASE}/auth/login", json=login_data)
if r.status_code == 200 and r.json().get("token"):
    token = r.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Logged in as test user")
else:
    print("❌ Login failed")
    exit()

# --------------------------
# Test 3: Fetch books
# --------------------------
r = requests.get(f"{BASE}/books", headers=headers)
if r.status_code == 200:
    books = r.json()
    print(f"✅ Total books fetched: {len(books)}")
    for b in books:
        print(f"- {b['title']} | Issued: {b.get('issuedCount',0)} | Available: {b.get('availableQuantity',0)}")
else:
    print("❌ Failed to fetch books")
    books = []

# --------------------------
# Test 4: Issue first 2 available books
# --------------------------
issued_books = []
for b in books:
    if b.get("availableQuantity",0) > 0 and len(issued_books) < 2:
        book_id = b["_id"]
        r = requests.post(f"{BASE}/issued/issue", headers={**headers, "Content-Type":"application/json"}, json={"bookId": book_id})
        if r.status_code == 201:
            issued_books.append({
                "_id": book_id,
                "title": b["title"],
                "dueAt": r.json().get("dueAt")
            })
            print(f"✅ Issued book: {b['title']}")
        else:
            print(f"❌ Could not issue book: {b['title']}")

# --------------------------
# Test 5: Total issued books for user
# --------------------------
r = requests.get(f"{BASE}/issued/user", headers=headers)
if r.status_code == 200:
    user_issued = r.json()
    print(f"ℹ️ Total issued books for user: {len(user_issued)}")
else:
    print("❌ Could not fetch user issued books")

# --------------------------
# Test 6: Return only the first issued book
# --------------------------
if issued_books:
    b = issued_books[0]
    r = requests.post(f"{BASE}/issued/return", headers={**headers, "Content-Type":"application/json"}, json={"bookId": b["_id"]})
    if r.status_code == 200:
        print(f"✅ Returned book: {b['title']}")
    else:
        print(f"❌ Could not return book: {b['title']}")
