Here is the professional project documentation for the **Ethiopian Basketball Federation (EBF) League Management System**. 

This blueprint integrates your requirement for a **Vue.js frontend**, the single-officer workflow, the 5-round reset logic, and professional FIBA basketball standards.

---

# Project Blueprint: EBF League Management System

## 1. Executive Summary
The EBF League Management System is a Progressive Web App (PWA) designed to digitalize and automate the basketball standings workflow. It transitions the federation from a manual, document-based process to a real-time, state-based digital platform. The system eliminates manual calculation errors, automates tie-breakers, seamlessly handles multi-round resets, and provides one-click official reporting.

## 2. Technical Architecture
The application follows a decoupled architecture, prioritizing mobile responsiveness, real-time data synchronization, and offline capabilities for stadium environments.

### Tech Stack
* **Frontend Framework:** **Vue.js (Vue 3 + Composition API)**
    * *Why Vue?* Vue’s reactive data binding is perfectly suited for live sports dashboards. When a score updates, the standings table component reacts and re-renders instantly without complex state management.
* **Build Tool & PWA:** **Vite** + `vite-plugin-pwa`
* **Styling:** **Tailwind CSS** (for clean, responsive tables and mobile-first UI).
* **Backend & Database:** **Supabase** (PostgreSQL)
    * Handles authentication, database storage, and real-time WebSockets.
* **Export Libraries:**
    * **PDF:** `jspdf` and `jspdf-autotable` (for official federation documents).
    * **Image:** `html-to-image` (for social media sharing).

## 3. User Roles & Permissions
To streamline the workflow for a single operator while maintaining public transparency, the system utilizes a two-tier role architecture.

| Role | Access Level | Description & Capabilities |
| :--- | :--- | :--- |
| **League Controller (Officer)** | Authenticated (Write Access) | The sole administrator. Responsibilities include: setting up seasons, managing team rosters, inputting match scores, closing/resetting rounds, and generating official exports. |
| **Public Viewer** | Unauthenticated (Read-Only) | Club managers, coaches, and fans. Can view live standings, match histories, and download shared graphics. |

## 4. Core Business Logic (The Rules Engine)
The system programmatically enforces FIBA international basketball standards to automate all calculations previously done manually.

### A. Scoring System
* **Win:** 2 Points
* **Loss:** 1 Point (awarded for completing the match).
* **Forfeit:** 0 Points.
* *Note: Basketball matches cannot end in a draw; overtime is played until a winner is decided.*

### B. Tie-Breaking Algorithm (Automated)
If two or more teams have identical league points, the system automatically sorts them using the following priority cascade:
1.  **Head-to-Head Result:** Only the match results between the tied teams are considered.
2.  **Point Difference (Head-to-Head):** If three teams are tied, point difference is calculated *only* using games played among the tied teams.
3.  **Overall Point Difference:** Total points scored minus total points conceded across the entire round.

### C. The Multi-Round System (5-Round Logic)
The Ethiopian Premier League utilizes a cumulative multi-round format. The system handles this via a dual-table logic:
* **Local View (Active Round):** Displays only matches for the current round. Standings start at zero. Used for daily tracking and round-specific awards.
* **Global View (Season Trophy):** An aggregated view summing points and differences across all completed rounds to determine the ultimate season champion.

## 5. Database Schema (PostgreSQL via Supabase)
The database is structured to separate historical data from active data, enabling the round-reset feature.

**Table: `teams`**
* `id` (UUID, Primary Key)
* `name` (String, e.g., "Hawassa City")
* `gender` (Enum: 'Male', 'Female')
* `logo_url` (String)

**Table: `rounds`**
* `id` (UUID, Primary Key)
* `season_year` (Integer, e.g., 2018)
* `round_number` (Integer, 1-5)
* `status` (Enum: 'Pending', 'Active', 'Completed')

**Table: `matches`**
* `id` (UUID, Primary Key)
* `round_id` (UUID, Foreign Key)
* `home_team_id` (UUID, Foreign Key)
* `away_team_id` (UUID, Foreign Key)
* `home_score` (Integer, nullable)
* `away_score` (Integer, nullable)
* `status` (Enum: 'Scheduled', 'Completed')

**Table: `round_snapshots`**
* *Purpose:* To freeze the standings table when a round closes, ensuring historical records cannot be accidentally altered by future data entry.

## 6. Core Application Workflows

### Workflow 1: Match Day Data Entry
1.  The League Controller opens the Vue.js PWA on their mobile device.
2.  Navigates to the "Active Round" dashboard.
3.  Selects a scheduled match and inputs the final `home_score` and `away_score`.
4.  Upon clicking "Save," a Vue watcher triggers the standings engine. The Points, Point Difference, and Rankings are recalculated instantly.

### Workflow 2: Exporting & Distribution
1.  From the Standings view, the Controller selects an export format.
2.  **PDF Export:** `jspdf` strips away the UI buttons, applies the EBF header/logo, and generates a clean, printable A4 document.
3.  **PNG Export:** `html-to-image` takes a snapshot of a mobile-optimized Vue component (the "Social Card") and downloads it for immediate sharing on Telegram.

### Workflow 3: Closing a Round
1.  Once all matches in Round 1 are marked 'Completed', the Controller clicks **"Finalize Round"**.
2.  The system writes the final computed standings to the `round_snapshots` table.
3.  The system updates Round 1 status to 'Completed' and changes Round 2 status to 'Active'.
4.  The main dashboard automatically clears the local standings (resetting to 0) while appending the points to the Season Global View.

