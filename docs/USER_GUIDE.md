# 📖 TaskFlow SaaS — End-to-End User Manual & Standard Operating Procedures (SOPs)

> **Document Version:** 2.0.0  
> **Target Audience:** Team Members, Team Leads, Reception Staff, and Super Admins  
> **Status:** Production Verified  
> **Last Updated:** October 15, 2026

---

## 1. Quick Start Guide for All Employees

### 1.1. Logging In
1. Navigate to [https://taskflow-saas-app-five.vercel.app](https://taskflow-saas-app-five.vercel.app).
2. Enter your corporate email address (`@ambizcon.com`) or use the **1-Click Persona Switcher** for instant role testing.
3. Upon authentication, you will be redirected to the **Dashboard Overview**.

### 1.2. Navigating the Interface
- **Top Navbar:** Quick actions including **Create Task**, **Global Search (`⌘K`)**, **Notifications**, **Company Switcher**, and **Profile / Theme Menu**.
- **Left Sidebar:** Primary navigation across Tasks, Incoming, Attendance, Chat, Claims, Reports, and Settings.
- **Keyboard Shortcuts:** Press `?` anywhere to open the hotkey cheat sheet.

---

## 2. Team Member SOPs (e.g., Mathan MK, Preethi)

### 2.1. Creating Tasks with Quick Start Templates
1. Click the **"Create Task"** button in the top navbar or on the Kanban board.
2. Under **Quick Start (Repetitive Tasks)**, select the template matching your assignment (e.g., `Blogs drafting`, `Content Creation`, `Mailer`, `SEO & Keywords`, `Website Content Creation & Drafting`, or `Daily & User Log`).
3. The modal will instantly populate:
   - Task Title
   - Pre-formatted `[ ]` checklist checkboxes in the Description
   - Estimated Hours (e.g., 4h)
   - Target Department
4. Adjust the title or due date if needed.
5. Click **Create Task**. The task appears immediately in `To Do`.

### 2.2. Tracking Work & Submitting for TL Review
1. Drag your task from `To Do` to `In Progress`.
2. As you finish checklist items, click the task card and check the corresponding `[ ]` boxes.
3. **Log Hours:** Under "Log Hours", enter the time worked and a brief note. If working overtime, toggle **"Worked Extra Hr (Overtime)"** to ON.
4. **Submitting for Review:**
   - Drag the card to `Done` or click "Submit for Review" inside the task modal.
   - A modal will open prompting you to select your Team Lead (e.g., Anirudh) and enter a submission note.
   - Click **Submit**. Your task status moves to `Review` with an amber badge `⏳ In Review (TL Name)`.
   - Once approved by your TL, it will officially move to `Done` and display `✅ Approved`.

### 2.3. Attendance & Break Clocking
1. Open **Attendance** (`/attendance`) on your mobile phone or laptop.
2. Click **Scan Kiosk QR** and point your device camera at the reception kiosk terminal to clock in.
3. During work:
   - Click **Tea Break** or **Lunch Break** to pause work tracking.
   - Click **End Break** when returning to resume duty.
4. When leaving the office, scan the kiosk QR again or click **Clock Out**.

### 2.4. Submitting & Editing Expense Reimbursements
1. Navigate to **Reimbursements** (`/reimbursements`).
2. Click **+ Add Claim**.
3. Fill in Category, Amount (₹), Date, Description, and upload your bill receipt (< 5MB).
4. Click **Submit Claim**. It appears in the ledger with status `Pending Approval`.
5. **Editing Before Approval:** If you made a mistake on your claim, click the **Edit (✏️)** button. You can update amounts, dates, or re-upload bills freely while status is pending. Once approved by Admin, the record is locked.

---

## 3. Team Lead (TL) SOPs (e.g., Anirudh)

### 3.1. Reviewing & Approving Member Tasks
1. Tasks submitted by your members will appear in the `Review` column on the Kanban board.
2. Click the task card to inspect attachments, time logs, and checklist progress.
3. **To Approve:** Click **"Approve Review to Completed (Done)"**.
   - Status updates to `Done`.
   - Immutable audit footprint is recorded: `[Footprint: Anirudh (Team Lead) Approved → Completed]`.
   - Notifications are dispatched **only** to Admin, you (TL), and the member (e.g., Mathan MK). Other members are shielded.
4. **To Request Changes:** Click **"Request Changes"**.
   - Enter specific feedback (e.g., *"Please update meta tags to include primary keyword"*).
   - Task reverts to `In Progress` with amber footprint note.

### 3.2. Triaging the Cross-Team Incoming Queue
1. Navigate to **Incoming Requests** (`/incoming`).
2. Review requests raised by other departments (e.g. Marketing asking Development for website changes).
3. Click **Accept & Assign** to select an internal team member and move the task to `To Do`, or **Reject** with a reason.

---

## 4. Super Admin SOPs (e.g., Mathan P)

### 4.1. Monitoring Company Presence & Muster Panel
1. Open the **Dashboard** (`/dashboard`).
2. The **Team Presence Overview Panel** displays live headcount, active clock-in times, break states, and daily working hours.
3. Use the **Entity Switcher** in the top navbar to toggle between **Ambizcon Health - India** and **Ambizcon Australia** to inspect regional headcounts.

### 4.2. Operating the Reception QR Kiosk
1. On the reception office tablet, log in as Super Admin or Reception Staff.
2. Navigate to `/attendance` and click **Launch Kiosk**.
3. The display will enter full-screen mode, generating a dynamic rotating QR code every 15 seconds for employee clock-ins.

### 4.3. Managing User Accounts
1. Navigate to **Team Members** (`/users`).
2. **Add New Member:** Click "+ Add Member", enter legal name, corporate email (`@ambizcon.com`), role, and assigned team.
3. **Change Role:** Use the inline role dropdown to promote or reassign members instantly.
