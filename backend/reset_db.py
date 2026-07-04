import os
from sqlalchemy import create_engine
from database import engine, Base
import models.domain

print("Dropping all tables...")
Base.metadata.drop_all(bind=engine)
print("Creating all tables...")
Base.metadata.create_all(bind=engine)
print("Database schema successfully recreated!")
