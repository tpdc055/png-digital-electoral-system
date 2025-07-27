# 🇵🇬 PNG Digital Electoral System - Production User Setup

## Creating Your First Admin User

Since demo mode has been disabled for production, you need to create your first admin user through Firebase Console.

### Step 1: Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `png-citizen-registration-prod`
3. Navigate to **Authentication** → **Users**

### Step 2: Create Admin User

1. Click **"Add user"**
2. Enter admin details:
   ```
   Email: admin@electoral.gov.pg
   Password: [Create a strong password]
   ```
3. Click **"Add user"**

### Step 3: Set User Role in Firestore

1. Go to **Firestore Database**
2. Navigate to **users** collection
3. Create a document with the User ID (UID) from step 2
4. Add these fields:
   ```json
   {
     "displayName": "System Administrator",
     "email": "admin@electoral.gov.pg",
     "role": "system_administrator",
     "province": "National Capital District",
     "isActive": true,
     "createdAt": "2024-01-27T00:00:00.000Z",
     "updatedAt": "2024-01-27T00:00:00.000Z"
   }
   ```

### Step 4: Additional Users

Create these essential production users:

#### Electoral Commissioner
```json
{
  "email": "commissioner@electoral.gov.pg",
  "displayName": "Electoral Commissioner",
  "role": "electoral_commissioner",
  "province": "National Capital District",
  "isActive": true
}
```

#### Registration Officers (Per Province)
```json
{
  "email": "registration.ncd@electoral.gov.pg",
  "displayName": "NCD Registration Officer",
  "role": "registration_officer",
  "province": "National Capital District",
  "constituency": "Port Moresby South",
  "isActive": true
}
```

#### Field Enumerators (Per District)
```json
{
  "email": "enumerator.ncd@electoral.gov.pg",
  "displayName": "NCD Field Enumerator",
  "role": "field_enumerator",
  "province": "National Capital District",
  "constituency": "Port Moresby South",
  "district": "Port Moresby Central",
  "isActive": true
}
```

### User Roles & Permissions

| Role | Access Level | Permissions |
|------|-------------|-------------|
| `system_administrator` | Full system access | All modules, user management |
| `electoral_commissioner` | Strategic oversight | Elections, reporting, approvals |
| `registration_officer` | Provincial operations | Citizen registration, data verification |
| `field_enumerator` | District data entry | Local registration, mobile operations |
| `tally_officer` | Vote counting | Election results, LPV calculations |
| `observer` | Read-only monitoring | View reports, monitor processes |

### Security Guidelines

1. **Strong Passwords**: Minimum 12 characters with mixed case, numbers, symbols
2. **Email Format**: Use official PNG government domains (.gov.pg)
3. **Role Assignment**: Assign minimal required permissions
4. **Geographic Limits**: Restrict access to specific provinces/constituencies
5. **Regular Audits**: Review user access quarterly

### Support

For technical assistance with user setup:
- Email: support@electoral.gov.pg
- Phone: +675-XXX-XXXX

---

**🔒 Production Security Enabled**
Demo mode has been completely disabled for live electoral operations.
