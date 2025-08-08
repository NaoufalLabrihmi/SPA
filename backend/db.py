import os
import mysql.connector
from dotenv import load_dotenv

# Determine which .env file to load
ENV = os.getenv("ENV", "development")
if ENV == "production":
    env_path = os.path.join(os.path.dirname(__file__), '.env.production')
else:
    env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

MYSQL_HOST = os.getenv("MYSQL_HOST")
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_DB = os.getenv("MYSQL_DB")

def get_connection():
    return mysql.connector.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DB
    ) 