import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CLAIMS_FILE = path.join(DATA_DIR, 'claims.json');
const PARKING_LOTS_FILE = path.join(DATA_DIR, 'parking-lots.json');

function initDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(CLAIMS_FILE)) {
    fs.writeFileSync(CLAIMS_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(PARKING_LOTS_FILE)) {
    const initialParkingLots = [
      { id: '1', name: '임시 주차장', maxFee: 4800, createdAt: new Date().toISOString() },
      { id: '2', name: '정신병원', maxFee: 3600, createdAt: new Date().toISOString() }
    ];
    fs.writeFileSync(PARKING_LOTS_FILE, JSON.stringify(initialParkingLots, null, 2));
  }
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  accountInfo: string;
  role: 'user' | 'admin' | 'manager';
  createdAt: string;
  passwordUpdatedAt?: string;
}

export interface Claim {
  id: string;
  userId: string;
  parkingName: string;
  fee: number;
  entryTime: string;
  exitTime: string;
  status: 'approved' | 'rejected' | 'pending';
  imageUrl: string; 
  createdAt: string;
}

export function getUsers(): User[] {
  initDb();
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  return JSON.parse(data);
}

export function saveUsers(users: User[]) {
  initDb();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function getUserByEmail(email: string): User | undefined {
  return getUsers().find(u => u.email === email);
}

export function getUserById(id: string): User | undefined {
  return getUsers().find(u => u.id === id);
}

export function updateUserAccount(id: string, accountInfo: string): boolean {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return false;
  users[index].accountInfo = accountInfo;
  saveUsers(users);
  return true;
}

export function deleteUser(id: string): boolean {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== id);
  if (users.length === filtered.length) return false;
  saveUsers(filtered);
  // Also delete their claims
  const claims = getClaims();
  saveClaims(claims.filter(c => c.userId !== id));
  return true;
}

export function updateUserRole(id: string, role: 'admin' | 'manager' | 'user'): boolean {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return false;
  users[index].role = role;
  saveUsers(users);
  return true;
}

export function resetUserPassword(id: string, passwordHash: string): boolean {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return false;
  users[index].passwordHash = passwordHash;
  users[index].passwordUpdatedAt = new Date().toISOString();
  saveUsers(users);
  return true;
}

export function getClaims(): Claim[] {
  initDb();
  const data = fs.readFileSync(CLAIMS_FILE, 'utf-8');
  return JSON.parse(data);
}

export function saveClaims(claims: Claim[]) {
  initDb();
  fs.writeFileSync(CLAIMS_FILE, JSON.stringify(claims, null, 2));
}

export function checkDuplicateClaim(entryTime: string, exitTime: string): boolean {
  return getClaims().some(c => c.entryTime === entryTime && c.exitTime === exitTime);
}

export interface ParkingLot {
  id: string;
  name: string;
  maxFee: number;
  createdAt: string;
}

export function getParkingLots(): ParkingLot[] {
  initDb();
  const data = fs.readFileSync(PARKING_LOTS_FILE, 'utf-8');
  return JSON.parse(data);
}

export function saveParkingLots(lots: ParkingLot[]) {
  initDb();
  fs.writeFileSync(PARKING_LOTS_FILE, JSON.stringify(lots, null, 2));
}
