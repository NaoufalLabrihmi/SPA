from fastapi import APIRouter, HTTPException, Body, Depends
from db import get_connection
from auth import get_current_user

router = APIRouter()

@router.get('/company')
def get_company(user=Depends(get_current_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM company WHERE id=1')
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        if not row:
            raise HTTPException(status_code=404, detail='Company not found')
        return row
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put('/company')
def update_company(data: dict = Body(...), user=Depends(get_current_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE company SET
                name=%s,
                street=%s,
                postal_code=%s,
                city=%s,
                contact_person=%s,
                phone=%s,
                reference=%s,
                company_number=%s
            WHERE id=1
        ''', (
            data.get('name'),
            data.get('street'),
            data.get('postal_code'),
            data.get('city'),
            data.get('contact_person'),
            data.get('phone'),
            data.get('reference'),
            data.get('company_number')
        ))
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Company updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
