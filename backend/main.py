from fastapi import FastAPI, HTTPException, Depends, status, Query, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pymongo import MongoClient
from bson import ObjectId
import json
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime, timedelta
import os
from jose import JWTError, jwt
from passlib.context import CryptContext
import uuid
from enum import Enum

# MongoDB setup
MONGO_URI = "mongodb+srv://dheerendraghoshghosh6:qwertyuiop12345@cluster0.kqmswt1.mongodb.net/db1"
client = MongoClient(MONGO_URI)
db = client["campus_fix"]
users_collection = db["users"]
issues_collection = db["issues"]

# JWT settings
SECRET_KEY = "your-secret-key"  # In production, use a secure random key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Password hashing
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")

# OAuth2 setup
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Initialize FastAPI app
app = FastAPI(title="Campus Fix API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# User type enum
class UserType(str, Enum):
    student = "student"
    management = "management"

# Service type enum
class ServiceType(str, Enum):
    electrical = "electrical"
    plumbing = "plumbing"
    furniture = "furniture"
    cleaning = "cleaning"
    it_support = "it_support"
    others = "others"

# Status enum
class Status(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    rejected = "rejected"

# Pydantic models
class UserBase(BaseModel):
    name: str
    email: str
    college_id: str
    user_type: UserType

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    hashed_password: str

class User(UserBase):
    id: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: UserType

class TokenData(BaseModel):
    email: Optional[str] = None

class IssueBase(BaseModel):
    service_type: ServiceType
    description: str
    location: str
    image_url: Optional[str] = None

class IssueCreate(IssueBase):
    pass

class Issue(IssueBase):
    id: str
    ticket_id: str
    student_id: str
    student_name: str
    timestamp: datetime
    status: Status = Status.pending

class IssueUpdate(BaseModel):
    status: Status

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_email(email: str):
    user = users_collection.find_one({"email": email})
    if user:
        return UserInDB(**user)
    return None

def authenticate_user(college_id: str, password: str):
    user = get_user_by_college_id(college_id)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def get_user_by_college_id(college_id: str):
    user = users_collection.find_one({"college_id": college_id})
    if user:
        return UserInDB(**user)
    return None 

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = get_user_by_email(email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

async def get_current_student(current_user: UserInDB = Depends(get_current_user)):
    if current_user.user_type != UserType.student:
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

async def get_current_management(current_user: UserInDB = Depends(get_current_user)):
    if current_user.user_type != UserType.management:
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

# Convert ObjectId to string in responses
class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return json.JSONEncoder.default(self, o)

# API Routes
# Update the UserBase model to include email
class UserBase(BaseModel):
    name: str
    email: str  # Added email field
    college_id: str
    user_type: UserType

# Update the register function to accept email
@app.post("/register", response_model=User)
async def register(
    name: str = Form(...),
    email: str = Form(...),  # Add email parameter
    college_id: str = Form(...),
    user_type: UserType = Form(...),
    password: str = Form(...)
):
    # Check if college_id already exists
    db_user = get_user_by_college_id(college_id)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="College ID already registered"
        )
    
    # Check if email already exists
    email_user = get_user_by_email(email)
    if email_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(password)
    
    user_in_db = UserInDB(
        name=name,
        email=email,  # Include email
        college_id=college_id,
        user_type=user_type,
        hashed_password=hashed_password
    )
    
    # Insert into MongoDB
    try:
        result = users_collection.insert_one(user_in_db.dict())
        return User(
            name=name,
            email=email,  # Include email in response
            college_id=college_id,
            user_type=user_type,
            id=str(result.inserted_id)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Update the login function to also update the JWT token with the email
@app.post("/login")
async def login(
    college_id: str = Form(...),
    password: str = Form(...)
):
    user = authenticate_user(college_id, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect college ID or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},  # Use email for JWT token
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": user.user_type
    }
@app.post("/issues/raise", response_model=Issue)
async def raise_issue(
    issue: IssueCreate, 
    current_user: UserInDB = Depends(get_current_student)
):
    # Generate unique ticket ID
    ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"
    
    # Create issue document
    issue_data = issue.dict()
    new_issue = {
        **issue_data,
        "student_id": current_user.id,
        "student_name": current_user.name,
        "ticket_id": ticket_id,
        "timestamp": datetime.utcnow(),
        "status": Status.pending
    }
    
    # Insert into MongoDB
    result = issues_collection.insert_one(new_issue)
    new_issue["id"] = str(result.inserted_id)
    
    return Issue(**new_issue)

@app.get("/issues/my", response_model=List[Issue])
async def get_my_issues(
    status: Optional[Status] = None,
    current_user: UserInDB = Depends(get_current_student)
):
    query = {"student_id": current_user.id}
    
    if status:
        query["status"] = status
    
    issues = list(issues_collection.find(query))
    
    # Convert ObjectId to string
    for issue in issues:
        issue["id"] = str(issue.pop("_id"))
    
    return issues

@app.get("/issues/all", response_model=List[Issue])
async def get_all_issues(
    status: Optional[Status] = None,
    service_type: Optional[ServiceType] = None,
    location: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_management)
):
    query = {}
    
    if status:
        query["status"] = status
    
    if service_type:
        query["service_type"] = service_type
    
    if location:
        query["location"] = location
    
    issues = list(issues_collection.find(query))
    
    # Convert ObjectId to string
    for issue in issues:
        issue["id"] = str(issue.pop("_id"))
    
    return issues

@app.put("/issues/mark-complete/{ticket_id}", response_model=Issue)
async def mark_issue_complete(
    ticket_id: str,
    update: IssueUpdate,
    current_user: UserInDB = Depends(get_current_management)
):
    issue = issues_collection.find_one({"ticket_id": ticket_id})
    
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue with ticket ID {ticket_id} not found"
        )
    
    # Update status
    result = issues_collection.update_one(
        {"ticket_id": ticket_id},
        {"$set": {"status": update.status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Issue not updated"
        )
    
    # Get updated issue
    updated_issue = issues_collection.find_one({"ticket_id": ticket_id})
    updated_issue["id"] = str(updated_issue.pop("_id"))
    
    return Issue(**updated_issue)

@app.get("/issues/{ticket_id}", response_model=Issue)
async def get_issue_by_id(
    ticket_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    issue = issues_collection.find_one({"ticket_id": ticket_id})
    
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )
    
    # Check authorization
    if current_user.user_type == UserType.student and issue["student_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this issue"
        )
    
    issue["id"] = str(issue.pop("_id"))
    
    return Issue(**issue)

@app.get("/issues/filter", response_model=List[Issue])
async def filter_issues(
    status: Optional[Status] = None,
    service_type: Optional[ServiceType] = None,
    location: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_management)
):
    query = {}
    
    if status:
        query["status"] = status
    
    if service_type:
        query["service_type"] = service_type
    
    if location:
        query["location"] = location
    
    if date_from or date_to:
        query["timestamp"] = {}
        
        if date_from:
            query["timestamp"]["$gte"] = datetime.fromisoformat(date_from)
        
        if date_to:
            query["timestamp"]["$lte"] = datetime.fromisoformat(date_to)
    
    issues = list(issues_collection.find(query))
    
    # Convert ObjectId to string
    for issue in issues:
        issue["id"] = str(issue.pop("_id"))
    
    return issues

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)