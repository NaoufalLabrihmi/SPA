from fastapi import FastAPI, HTTPException, Depends, status, Request, Security, Body
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
from routes_employees import router as employees_router
from routes_erklaerung_form import router as erklaerung_form_router
from routes_einkommensbescheinigung import router as einkommensbescheinigung_router
from routes_company import router as company_router
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
import jwt
import bcrypt
import datetime
import mysql.connector
from db import get_connection
from auth import get_current_user, create_access_token
import requests
import secrets
from email.mime.text import MIMEText
import smtplib
from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(level=logging.INFO)

app = FastAPI()

# CORS setup (adjust origins as needed)
origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(employees_router)
app.include_router(erklaerung_form_router)
app.include_router(einkommensbescheinigung_router)
app.include_router(company_router)

SECRET_KEY = os.getenv("JWT_SECRET", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day
RESET_TOKEN_EXPIRY_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE username = %s OR email = %s", (form_data.username, form_data.username))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    if not bcrypt.checkpw(form_data.password.encode(), user['password'].encode()):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    token = create_access_token({"sub": user['username'], "role": user['role'], "user_id": user['id']})
    return {"access_token": token, "token_type": "bearer", "role": user['role'], "username": user['username']}

@app.get("/")
def root():
    return {"status": "ok"}

@app.get("/holidays/{year}")
def get_holidays(year: int, state: str = 'sn'):
    url = f"https://get.api-feiertage.de/?years={year}&states={state}"
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        holidays = data.get('feiertage', [])
        # Map to { [month]: { [day]: true } }
        result = {}
        for h in holidays:
            d = h.get('date')
            if not d:
                continue
            dt = datetime.datetime.strptime(d, "%Y-%m-%d")
            m = dt.month
            day = dt.day
            if m not in result:
                result[m] = {}
            result[m][str(day).zfill(2)] = True
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch holidays: {str(e)}")

@app.get("/users")
def list_users(user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admins only")
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, username, email, role FROM users")
    users = cursor.fetchall()
    cursor.close()
    conn.close()
    return users

@app.post("/users")
def create_user(data: dict = Body(...), user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admins only")
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user')
    if not username or not email or not password:
        raise HTTPException(status_code=400, detail="Missing fields")
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO users (username, email, password, role) VALUES (%s, %s, %s, %s)", (username, email, hashed, role))
        conn.commit()
    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail=f"User creation failed: {str(e)}")
    cursor.close()
    conn.close()
    return {"message": "User created"}

@app.patch("/users/{user_id}")
def update_user(user_id: int, data: dict = Body(...), user=Depends(get_current_user)):
    if user.get('role') != 'admin' and int(user.get('user_id')) != int(user_id):
        raise HTTPException(status_code=403, detail="Not allowed")
    fields = []
    values = []
    for k in ['username', 'email', 'role']:
        if k in data:
            if k == 'role' and user.get('role') != 'admin':
                continue  # Only admin can change role
            fields.append(f"{k}=%s")
            values.append(data[k])
    if 'password' in data and data['password']:
        fields.append("password=%s")
        values.append(bcrypt.hashpw(data['password'].encode(), bcrypt.gensalt()).decode())
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    values.append(user_id)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(f"UPDATE users SET {', '.join(fields)} WHERE id=%s", tuple(values))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "User updated"}

@app.delete("/users/{user_id}")
def delete_user(user_id: int, user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admins only")
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id=%s", (user_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "User deleted"}

@app.post("/forgot-password")
def forgot_password(data: dict = Body(...)):
    email = data.get('email')
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, username FROM users WHERE email=%s", (email,))
    user = cursor.fetchone()
    if not user:
        cursor.close()
        conn.close()
        return {"message": "If the email exists, a reset link will be sent."}
    token = secrets.token_urlsafe(48)
    expiry = (datetime.datetime.utcnow() + datetime.timedelta(minutes=RESET_TOKEN_EXPIRY_MINUTES)).isoformat()
    cursor.execute("INSERT INTO password_resets (user_id, token, expires_at) VALUES (%s, %s, %s)", (user['id'], token, expiry))
    conn.commit()
    cursor.close()
    conn.close()
    reset_url = os.getenv('FRONTEND_URL', 'http://localhost:8080') + f"/reset-password?token={token}"
    msg = MIMEText(f"Hello {user['username']},\n\nClick the link to reset your password: {reset_url}\n\nIf you did not request this, ignore this email.")
    msg['Subject'] = 'Password Reset'
    msg['From'] = os.getenv('EMAIL_FROM')
    msg['To'] = email
    try:
        with smtplib.SMTP_SSL(os.getenv('EMAIL_HOST'), int(os.getenv('EMAIL_PORT'))) as server:
            server.login(os.getenv('EMAIL_USER'), os.getenv('EMAIL_PASS'))
            server.sendmail(msg['From'], [msg['To']], msg.as_string())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
    return {"message": "If the email exists, a reset link will be sent."}

@app.post("/reset-password")
def reset_password(data: dict = Body(...)):
    token = data.get('token')
    new_password = data.get('password')
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and new password required")
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT user_id, expires_at FROM password_resets WHERE token=%s", (token,))
    row = cursor.fetchone()
    if not row:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    if datetime.datetime.fromisoformat(row['expires_at']) < datetime.datetime.utcnow():
        cursor.execute("DELETE FROM password_resets WHERE token=%s", (token,))
        conn.commit()
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Token expired")
    hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    cursor.execute("UPDATE users SET password=%s WHERE id=%s", (hashed, row['user_id']))
    cursor.execute("DELETE FROM password_resets WHERE token=%s", (token,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Password reset successful"}

@app.get("/dashboard-stats")
def dashboard_stats(user=Depends(get_current_user)):
    if user.get('role') not in ('admin', 'user'):
        raise HTTPException(status_code=403, detail="Not allowed")
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    # Users
    cursor.execute("SELECT COUNT(*) as total_users FROM users")
    total_users = cursor.fetchone()['total_users']
    cursor.execute("SELECT COUNT(*) as total_admins FROM users WHERE role='admin'")
    total_admins = cursor.fetchone()['total_admins']
    # Employees
    cursor.execute("SELECT COUNT(*) as total_employees FROM employees")
    total_employees = cursor.fetchone()['total_employees']
    cursor.execute("SELECT COUNT(*) as total_minijobs FROM employees WHERE contract_type='TEILZEITTÄTIGKEIT - \"MINIJOB\"'")
    total_minijobs = cursor.fetchone()['total_minijobs']
    cursor.execute("SELECT COUNT(*) as total_fulltime FROM employees WHERE contract_type='VOLLZEITTÄTIGKEIT'")
    total_fulltime = cursor.fetchone()['total_fulltime']
    cursor.execute("SELECT COUNT(*) as total_parttime FROM employees WHERE contract_type='TEILZEITTÄTIGKEIT'")
    total_parttime = cursor.fetchone()['total_parttime']
    # Add more stats as needed
    cursor.close()
    conn.close()
    return {
        "total_users": total_users,
        "total_admins": total_admins,
        "total_employees": total_employees,
        "total_minijobs": total_minijobs,
        "total_fulltime": total_fulltime,
        "total_parttime": total_parttime
    }
