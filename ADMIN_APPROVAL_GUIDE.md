# Admin Approval Guide

## Quick Reference for Reviewing User Applications

---

## 🚀 Quick Start

### Accessing the Approval Panel

1. Login as admin
2. Navigate to: **Admin → User Approval**
3. You'll see a list of all pending applications

---

## 👥 Reviewing Applications

### What You'll See

Each pending application shows:

```
┌────────────────────────────────────────────────────────────┐
│ Sarah Wilson (sarah.wilson@research.edu)                   │
│ University Research Lab                                    │
│                                                            │
│ Type: University                                          │
│ Use: Academic Research                                    │
│ Country: Zimbabwe                                         │
│                                                            │
│ Details: "Studying urban growth patterns using satellite  │
│ imagery for PhD dissertation"                             │
│                                                            │
│ Applied: Jan 15, 2024 2:30 PM                            │
│                                                            │
│ [ Reject ] [ Approve ]                                    │
└────────────────────────────────────────────────────────────┘
```

### Red Flags to Watch For 🚩

- **Generic email addresses** (gmail, yahoo) for institutional claims
- **Vague intended use** ("personal project", "just browsing")
- **Suspicious organization names** (non-existent companies)
- **Commercial use** claiming educational access
- **Multiple applications** from same person

### Green Lights to Approve ✅

- **Institutional email domains** (.gov.zw, .ac.zw, .edu)
- **Specific use cases** with details
- **Verifiable organizations** (known councils, universities)
- **Professional requests** with clear objectives
- **Appropriate tier selection** based on need

---

## ✅ Approving Users

### Step 1: Click "Approve"

### Step 2: Assign Role

Choose based on user type and need:

| Choose | When |
|--------|------|
| **Viewer** | - Students doing coursework<br>- Personal learning<br>- Basic exploration |
| **Researcher** | - University researchers<br>- Academic projects<br>- Thesis/dissertation work |
| **Analyst** | - Government planners<br>- Council staff<br>- Policy makers |
| **Business User** | - Private companies<br>- Consulting firms<br>- Commercial projects |

### Step 3: Assign Access Tier

Choose based on organization and scale:

| Choose | When |
|--------|------|
| **Educational/Trial**<br>(10 AOIs, 50GB) | - Individual students<br>- Small academic projects<br>- Trial/exploration |
| **Government/Institutional**<br>(50 AOIs, 500GB) | - Councils & municipalities<br>- Universities & schools<br>- NGOs<br>- Government agencies |
| **Commercial**<br>(Unlimited) | - Private companies<br>- Large-scale projects<br>- Consulting firms |

### Step 4: Confirm

Click "Approve" to:
- Grant access immediately
- Assign quotas automatically
- Send email notification (coming soon)

---

## ❌ Rejecting Applications

### When to Reject

- Suspicious or fake information
- Inappropriate use case (e.g., reselling data)
- Personal email for institutional claim
- Insufficient details provided
- Policy violations

### Step 1: Click "Reject"

### Step 2: Provide Reason (Required)

**Good rejection reasons:**
- "Please use your institutional email address to verify affiliation"
- "Additional details about intended use required. Please reapply with specific project description"
- "Commercial use requires appropriate licensing. Contact admin for enterprise access"
- "Organization could not be verified. Please provide additional documentation"

**Avoid vague reasons:**
- ❌ "Denied"
- ❌ "Not approved"
- ❌ "Invalid"

### Step 3: Confirm

User will:
- Remain in system but with limited access
- See rejection reason on dashboard
- Be able to reapply with corrections

---

## 🎯 Common Scenarios & Recommendations

### Scenario 1: University Student
```
Name: John Mugabe
Email: j.mugabe@uz.ac.zw
Organization: University of Zimbabwe
Type: University
Use: Academic Research
Details: "Using satellite imagery for environmental science project"
```

**✅ APPROVE**
- Role: **Researcher**
- Tier: **Educational/Trial**
- Rationale: Verified institutional email, clear academic purpose

---

### Scenario 2: Local Council Planner
```
Name: Jane Moyo
Email: j.moyo@harare.gov.zw
Organization: Harare City Council
Type: Local Council
Use: Urban/Regional Planning
Details: "Infrastructure planning and informal settlement monitoring"
```

**✅ APPROVE**
- Role: **Analyst**
- Tier: **Government/Institutional**
- Rationale: Government email, legitimate planning use case

---

### Scenario 3: Private Company
```
Name: Michael Chen
Email: m.chen@geoconsult.co.zw
Organization: GeoConsult Zimbabwe
Type: Private Company
Use: Commercial Analysis
Details: "Providing geospatial analysis services to mining companies"
```

**✅ APPROVE** (if verified)
- Role: **Business User**
- Tier: **Commercial**
- Note: May want to verify company registration first

---

### Scenario 4: Suspicious Request
```
Name: Test User
Email: testuser123@gmail.com
Organization: Big Company
Type: Private Company
Use: Personal Learning
Details: ""
```

**❌ REJECT**
- Reason: "Please use a professional/institutional email address and provide details about your intended use"
- Red flags: Generic email, vague org name, no details

---

### Scenario 5: High School Teacher
```
Name: Tendai Ndlovu
Email: t.ndlovu@princeedward.ac.zw
Organization: Prince Edward High School
Type: High School
Use: Education/Teaching
Details: "Teaching GIS to A-Level geography students"
```

**✅ APPROVE**
- Role: **Researcher**
- Tier: **Educational/Trial**
- Note: Schools may need higher tier if multiple classes

---

### Scenario 6: Independent Researcher
```
Name: Sarah Kambudzi
Email: sarah.kambudzi@gmail.com
Organization: Independent
Type: Independent Researcher
Use: Research
Details: "Analyzing deforestation patterns in Masvingo Province for publication"
```

**⚠️ CONDITIONAL APPROVE**
- Role: **Viewer** or **Researcher**
- Tier: **Educational/Trial**
- Note: Monitor usage; upgrade if legitimate publication results

---

## 📊 Quick Decision Matrix

| Email Domain | Org Type | Details Quality | → Decision |
|--------------|----------|-----------------|------------|
| .gov/.ac | Any | Good | ✅ Approve (Institutional) |
| .gov/.ac | Any | Poor | ⚠️ Ask for clarification |
| Professional | Company | Good | ✅ Approve (Commercial) |
| Professional | Company | Poor | ⚠️ Ask for clarification |
| Generic (gmail) | Institution | Any | ❌ Reject (use institutional email) |
| Generic (gmail) | Individual | Good | ⚠️ Approve (Trial only) |
| Generic (gmail) | Individual | Poor | ❌ Reject (insufficient info) |

---

## 🔄 After Approval

### What Happens Next

1. **Immediate access** - User can now access full features based on role
2. **Quota assignment** - Storage and download limits set automatically
3. **Module access** - Features unlock based on assigned role
4. **Email notification** (coming soon) - User receives welcome email

### Monitoring Approved Users

Navigate to: **System → User Management**

You can:
- View all users and their roles
- See usage statistics
- Modify quotas if needed
- Deactivate users if necessary

---

## 🛠️ Advanced Admin Actions

### Changing User Roles After Approval

1. Go to **System → User Management**
2. Find the user
3. Click "Edit"
4. Change role or tier
5. Save changes

### Handling Quota Requests

If approved user requests more:
1. Review their current usage
2. Check if legitimate need
3. Update quotas in User Management
4. Or upgrade to higher tier

### Bulk Actions (Coming Soon)

- Approve multiple users at once
- Apply rules-based auto-approval
- Export application data

---

## 📈 Best Practices

### Do's ✅
- Review applications within 24-48 hours
- Provide specific rejection reasons
- Start users on appropriate tiers (can upgrade later)
- Verify institutional emails
- Check organization legitimacy for commercial requests

### Don'ts ❌
- Auto-approve without reviewing
- Approve obviously suspicious requests
- Reject without providing reason
- Assign admin roles to regular users
- Give unlimited access without justification

---

## 🆘 Troubleshooting

### Problem: Too many pending applications

**Solution:** Set up rules-based auto-approval for trusted domains
```
Auto-approve if:
- Email ends with .gov.zw
- Email ends with .ac.zw
- Organization type = University/School
```

### Problem: User says they were rejected but didn't receive email

**Solution:** Email notifications not yet implemented. Check rejection reason in admin panel and manually notify user.

### Problem: Approved user still has limited access

**Solution:** 
1. Check if approval actually saved (refresh page)
2. User may need to logout and login again
3. Check UserProfile in Django admin for approval_status

### Problem: Can't determine if organization is legitimate

**Solution:**
1. Google the organization
2. Check email domain
3. Request additional documentation
4. Start with Trial tier and monitor

---

## 📞 When in Doubt

**Conservative Approach:**
- Approve with **Viewer** role and **Trial** tier
- Monitor their usage
- Upgrade later if legitimate

**Why this works:**
- Minimal risk if suspicious
- Good user experience if legitimate
- Easy to upgrade, hard to downgrade
- Maintains platform integrity

---

## 📋 Approval Checklist

Before clicking approve, verify:

- [ ] Name looks legitimate
- [ ] Email domain matches organization type
- [ ] Organization is real/verifiable
- [ ] Intended use is clear and appropriate
- [ ] Use case matches requested tier
- [ ] No duplicate applications
- [ ] Role assignment is appropriate
- [ ] Tier matches organization size/need

---

**Remember:** When in doubt, start conservative. It's easier to upgrade an approved user than fix a security breach!

---

**Questions?** Contact platform administrators or check the full ACCESS_REQUEST_SYSTEM.md documentation.
