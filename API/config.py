import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    db_path = os.path.join(BASE_DIR, 'database.db')
    SQLALCHEMY_DATABASE_URI = os.getenv('SQLALCHEMY_DATABASE_URI', f'sqlite:///{db_path}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False