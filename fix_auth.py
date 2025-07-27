import re

# Read the file
with open('src/components/AuthenticatedApp.tsx', 'r') as f:
    content = f.read()

# Replace all authService calls with mock admin data
replacements = [
    ('authService.getUserDisplayName()', '"System Administrator"'),
    ('authService.getUserRoleDisplayName()', '"System Administrator"'),
    ('authService.hasPermission(\'citizen.create\')', 'true'),
    ('authService.hasRole(\'system_administrator\')', 'true'),
    ('authService.hasRole(\'registration_officer\')', 'true'),
    ('authService.hasRole(\'field_enumerator\')', 'true'),
    ('authService.hasRole(\'electoral_commissioner\')', 'true'),
    ('authService.hasRole(\'admin\')', 'true'),
]

for old, new in replacements:
    content = content.replace(old, new)

# Write back
with open('src/components/AuthenticatedApp.tsx', 'w') as f:
    f.write(content)

print("Fixed all authService calls for admin access")
