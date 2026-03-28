# Product Requirements Document (PRD)
## Brand-Creator Collaboration Platform

---

## 1. Product Vision

### 1.1 Overview
A desktop-first web platform that connects brands with content creators through an integrated system of collaborations, gamification, and rewards. The user experience is inspired by platforms like Airbnb/BigBox, prioritizing visual cards and intuitive navigation.

### 1.2 Value Proposition

**For Brands:**
- Discover and connect with content creators
- Launch marketing campaigns (exchanges and challenges)
- Manage user-generated content
- Build loyal communities through a points system

**For Users/Creators:**
- Build a professional public portfolio
- Participate in brand campaigns
- Earn points and rewards
- Advance in a gamified level system

---

## 2. Technical Architecture

### 2.1 Technical Stack

**Frontend:**
- **Framework:** Next.js (App Router)
- **UI Library:** React
- **State Management:** Zustand or React Query
- **Styling:** Tailwind CSS
- **Design Pattern:** Airbnb-style cards

**Backend:**
- **BaaS:** Supabase
  - Authentication
  - PostgreSQL database
  - Storage (optional media)
  - Edge Functions (complex logic/AI)

**AI/ML:**
- **Service:** Server-side Edge Function
- **Input:** Brand search prompt
- **Output:** Ranked list of users by relevance

---

## 3. Users and Permissions

### 3.1 User Types

#### Brand
**Characteristics:**
- Single account per company
- Full access to management features

**Capabilities:**
- Create campaigns (exchanges/challenges)
- Explore creator marketplace
- Invite specific users
- Score content deliverables
- Define and manage rewards
- Configure points store

#### User/Creator
**Characteristics:**
- Single type (no role differentiation)
- Includes: regular users, micro-influencers, influencers
- Differentiation through **dynamic level system**

**Capabilities:**
- Build public portfolio
- Apply to campaigns
- Participate in challenges
- Accumulate points per brand
- Redeem rewards
- Follow brands

---

## 4. Level System

### 4.1 Available Levels
- **Bronze** (0-50 points)
- **Silver** (50-150 points)
- **Gold** (150-300 points)
- **Platinum** (300-600 points)
- **Diamond** (600+ points)

### 4.2 Calculation Variables
- Number of exchanges obtained
- Number of completed campaigns
- Total accumulated points (global, all brands)
- Number of followers (Instagram + TikTok)
- Number of times selected by brands

### 4.3 MVP Formula

```
score = 
  (exchanges × 5) +
  (completed_challenges × 3) +
  (total_points ÷ 100) +
  (total_followers ÷ 1000) +
  (times_selected × 4)
```

**Ranges:**
- 0–50 → Bronze
- 50–150 → Silver
- 150–300 → Gold
- 300–600 → Platinum
- 600+ → Diamond

---

## 5. Data Model

### 5.1 Users
```sql
- id (PK)
- email (unique)
- password_hash
- role (enum: 'brand' | 'user')
- created_at
```

### 5.2 UserProfiles
```sql
- id (PK)
- user_id (FK → Users)
- username (unique)
- bio
- profile_image
- instagram_url
- tiktok_url
- youtube_url
- followers_instagram
- followers_tiktok
- followers_youtube
- total_points (global)
- level (enum)
- created_at
```

### 5.3 BrandProfiles
```sql
- id (PK)
- user_id (FK → Users)
- name
- description
- logo
- industry
- created_at
```

### 5.4 Campaigns
```sql
- id (PK)
- brand_id (FK → BrandProfiles)
- type (enum: 'exchange' | 'challenge')
- title
- description
- status (enum: 'draft' | 'active' | 'closed')
- created_at
```

### 5.5 Exchanges
```sql
- id (PK)
- campaign_id (FK → Campaigns)
- requirements (jsonb)
- reward_description
- reward_type (enum: 'product' | 'money' | 'both')
- money_amount (decimal)
- product_description
- slots (int)
- deadline (timestamp)
```

### 5.6 ExchangeApplications
```sql
- id (PK)
- exchange_id (FK → Exchanges)
- user_id (FK → UserProfiles)
- status (enum: 'applied' | 'invited' | 'accepted' | 'rejected')
- proposal_text
- created_at
```

### 5.7 Challenges
```sql
- id (PK)
- campaign_id (FK → Campaigns)
- is_multi_day (boolean)
- total_days (int)
- has_leaderboard (boolean)
- max_winners (int)
- scoring_type (enum: 'manual')
```

### 5.8 ChallengeDays
```sql
- id (PK)
- challenge_id (FK → Challenges)
- day_number (int)
- title
- description
- content_type (enum: 'video' | 'image' | 'text' | 'link')
- instructions
```

### 5.9 ChallengeSubmissions
```sql
- id (PK)
- challenge_id (FK → Challenges)
- day_id (FK → ChallengeDays)
- user_id (FK → UserProfiles)
- submission_url
- submission_text
- score (int 1-100)
- created_at
```

### 5.10 BrandPoints
```sql
- id (PK)
- brand_id (FK → BrandProfiles)
- user_id (FK → UserProfiles)
- points (int)
```
**Note:** Points are brand-specific, not global.

### 5.11 Rewards
```sql
- id (PK)
- brand_id (FK → BrandProfiles)
- title
- description
- points_cost (int)
- money_cost (decimal)
- reward_type (enum: 'product' | 'discount' | 'experience')
```

### 5.12 Redemptions
```sql
- id (PK)
- reward_id (FK → Rewards)
- user_id (FK → UserProfiles)
- points_used (int)
- money_paid (decimal)
- created_at
```

### 5.13 Follows
```sql
- id (PK)
- user_id (FK → UserProfiles)
- brand_id (FK → BrandProfiles)
- created_at
```

### 5.14 Invitations
```sql
- id (PK)
- brand_id (FK → BrandProfiles)
- user_id (FK → UserProfiles)
- campaign_id (FK → Campaigns)
- type (enum: 'exchange')
- status (enum: 'pending' | 'accepted' | 'rejected')
- created_at
```

---

## 6. Detailed User Flows

### 6.1 Brand Creates an Exchange

**Steps:**
1. Brand accesses dashboard
2. Click "Create campaign"
3. Select type: **Exchange**
4. Complete form:
   - Title
   - Description
   - Requirements (followers, category, etc.) → JSON
   - Reward type (product/money/both)
   - Amount $ (if applicable)
   - Product description
   - Number of available slots
   - Deadline
5. Submit → **Status: draft**
6. Brand reviews and publishes → **Status: active**

**Result:** Exchange visible in marketplace for users.

---

### 6.2 User Applies to Exchange

**Steps:**
1. User navigates exchange list
2. Sees exchange card (title, brand, reward)
3. Click → view full details
4. Click "Apply"
5. Complete form:
   - Personal message/proposal
6. Submit → **Status: applied**

**Result:** Application registered, brand can review.

---

### 6.3 Brand Invites User Directly

**Steps:**
1. Brand accesses creator marketplace
2. Apply filters (level, followers, etc.)
3. Click on user profile
4. Click "Invite to exchange"
5. Select active campaign
6. Confirm invitation

**Result:** Record created in `Invitations` table with status `pending`.

---

### 6.4 Brand Selects Participants

**Steps:**
1. Brand accesses campaign "Applicants"
2. Reviews list of applications
3. Click on user → view full profile
4. Decide: **Accept** or **Reject**

**Result:**
- `Accept` → status changes to **accepted**
- `Reject` → status changes to **rejected**

---

### 6.5 User Completes Exchange

**Steps:**
1. User receives acceptance notification
2. Creates content (post, video, etc.)
3. Publishes on social media
4. Returns to platform → uploads publication link
5. Brand manually validates completion

**Result:** Brand marks as completed, user receives reward.

---

### 6.6 Brand Creates Challenge

**Steps:**
1. Brand → "Create campaign"
2. Select type: **Challenge**
3. General configuration:
   - Name
   - Description
   - Multi-day: **true/false**
   - Leaderboard: **true**
   - Number of winners
4. If multi-day, configure each day:
   - Day 1, 2, 3... N
   - For each day:
     - Title
     - Specific instructions
     - Expected content type (video/image/text/link)
5. Submit → **Status: draft**
6. Publish → **Status: active**

**Result:** Challenge visible, users can participate.

---

### 6.7 User Participates in Challenge

**Steps:**
1. User sees challenge in list
2. Click → challenge details
3. Click "Participate"
4. **Day 1 unlocks automatically**
5. For each day:
   - User accesses active day
   - Reads instructions
   - Uploads content:
     - Link to publication
     - File (optional)
     - Descriptive text
   - Submit → `ChallengeSubmission` saved
6. Upon completing Day N, Day N+1 unlocks

**Result:** Submissions saved, brand can score.

---

### 6.8 Scoring and Leaderboard

**Steps:**
1. Brand accesses challenge "Submissions"
2. Reviews each submission per user/day
3. Assigns **manual score** (1-100)
4. System sums total score per user:
   ```sql
   SELECT user_id, SUM(score) as total_score
   FROM ChallengeSubmissions
   WHERE challenge_id = ?
   GROUP BY user_id
   ORDER BY total_score DESC
   ```
5. Leaderboard updates **in real-time**

**Result:** Ranking visible to users and brand.

---

### 6.9 Points Assignment

**Automatic Process:**
- For each `ChallengeSubmission` with score assigned:
  ```
  BrandPoints[brand_id][user_id] += score
  ```
- Points accumulate **per brand** (not global)

**Result:** User sees accumulated points per brand.

---

### 6.10 Points Redemption

**Steps:**
1. User accesses "Store" for specific brand
2. Views list of available `Rewards`
3. Click on reward → details
4. Click "Redeem"
5. System validates:
   ```
   if (user_points >= points_cost) {
     // Redemption successful
   } else {
     // Option to pay difference with $
   }
   ```
6. Record created in `Redemptions`
7. Points deducted from `BrandPoints`

**Result:** User redeems reward, brand manages delivery.

---

## 7. Creator Marketplace

### 7.1 Available Filters
- **Followers:** min/max range
- **Level:** Bronze, Silver, Gold, Platinum, Diamond
- **Category:** fitness, tech, beauty, etc.
- **Engagement:** mock (high/medium/low)
- **Platforms:** Instagram, TikTok, YouTube
- **Location:** country/city (optional)

### 7.2 AI Matching

**Input (Brand):**
```
"I'm looking for fitness influencers with high engagement in Argentina, 
 between 10k-50k Instagram followers"
```

**Backend Processing (Edge Function):**
1. Parse prompt using LLM
2. Convert to structured query:
   ```json
   {
     "category": "fitness",
     "engagement": "high",
     "location": "Argentina",
     "followers_instagram": { "min": 10000, "max": 50000 }
   }
   ```
3. Search DB with scoring
4. Rank by relevance

**Output:**
```json
[
  { "user_id": 123, "match_score": 95 },
  { "user_id": 456, "match_score": 87 },
  ...
]
```

---

## 8. Notification System

### 8.1 Triggers

| Event | Recipient | Description |
|--------|----------|-------------|
| New campaign | User (brand followers) | "Brand X launched new campaign" |
| Exchange invitation | Specific user | "Brand X invited you to an exchange" |
| Acceptance | User | "Your application was accepted" |
| Rejection | User | "Your application was rejected" |
| New day unlocked | Challenge participant | "Day 2 of challenge is available" |
| Score received | User | "You received 85 points from Brand X" |

### 8.2 Implementation
- **MVP:** In-app notifications (`Notifications` table)
- **Future:** Email, push notifications

---

## 9. Main Screens

### 9.1 User/Creator

| Screen | Description |
|--------|-------------|
| **Home** | Feed of active campaigns (exchanges + challenges) |
| **Marketplace** | Explore brands and campaigns |
| **Public Profile** | Portfolio with metrics, submissions, level |
| **My Campaigns** | Active and completed exchanges/challenges |
| **My Points** | Points breakdown per brand |
| **Store** | Available rewards per brand |
| **Notifications** | Notification center |

### 9.2 Brand

| Screen | Description |
|--------|-------------|
| **Dashboard** | Campaign overview, metrics, activity |
| **Create Campaign** | Wizard for exchanges/challenges |
| **My Campaigns** | Management of active/past campaigns |
| **Applicants** | Review applications and submissions |
| **Marketplace** | Explore creators (with AI matching) |
| **User Profile** | Detailed view of creator (portfolio) |
| **Store Config** | Manage rewards and redemptions |

---

## 10. API Endpoints

### 10.1 Authentication
```
POST /auth/signup
POST /auth/login
POST /auth/logout
GET  /auth/me
```

### 10.2 Campaigns
```
POST /campaigns              # Create campaign
GET  /campaigns              # List campaigns (filters)
GET  /campaigns/:id          # Campaign details
PATCH /campaigns/:id/status  # Change status (draft/active/closed)
```

### 10.3 Exchanges
```
POST /exchanges                    # Create exchange
GET  /exchanges                    # List exchanges
POST /exchanges/:id/apply          # User applies
POST /exchanges/:id/invite         # Brand invites user
POST /applications/:id/accept      # Brand accepts application
POST /applications/:id/reject      # Brand rejects application
```

### 10.4 Challenges
```
POST /challenges                   # Create challenge
GET  /challenges/:id               # Challenge details
POST /challenges/:id/join          # User joins
POST /challenges/:id/submit        # User submits
GET  /challenges/:id/leaderboard   # View ranking
PATCH /submissions/:id/score       # Brand assigns score
```

### 10.5 Points
```
GET  /brands/:id/points            # User points in brand
POST /points/add                   # System adds points
GET  /users/:id/points             # All user points
```

### 10.6 Rewards
```
GET  /brands/:id/rewards           # List brand rewards
POST /rewards                      # Create reward
POST /rewards/:id/redeem           # User redeems
GET  /redemptions                  # Redemption history
```

### 10.7 Marketplace
```
GET  /users/search                 # Search with filters
POST /users/search/ai              # AI-powered search
GET  /users/:id/profile            # Public profile
```

---

## 11. Key Business Rules

### 11.1 Points
- **Points are brand-specific** (not interchangeable)
- Automatically accumulated when receiving score on submissions
- Deducted when redeeming rewards

### 11.2 Leaderboard
- Updates **in real-time** when assigning scores
- Ordered by `SUM(score) DESC`
- Ties resolved by earlier `created_at`

### 11.3 Multi-day Challenges
- Days unlock **progressively**
- User must complete Day N to access Day N+1
- Cannot skip days

### 11.4 Brand Autonomy
- Brand defines everything: points, rewards, campaign rules
- Brand has full control over acceptance/rejection

### 11.5 Open Applications
- **Users can apply even if they don't meet exact requirements**
- Brand decides finally (enables discovery)

---

## 12. Edge Cases

### 12.1 User Applies and Later Gets Invited
**Scenario:** User applies to exchange, then brand invites them.

**Behavior:**
- If already applied with status `applied` → change to `invited`
- Notify user of invitation
- Don't duplicate records

### 12.2 User Doesn't Complete All Days
**Scenario:** User participates in multi-day challenge but abandons.

**Behavior:**
- Submissions up to that point remain valid
- Won't appear on leaderboard if minimum requirement not met (brand-defined)
- Accumulated points up to abandonment are kept

### 12.3 Leaderboard Tie
**Scenario:** Two users with same total score.

**Tiebreaker Criteria:**
1. Higher score on last day
2. If still tied: earlier `created_at` (first submission)

### 12.4 User Without Points Tries to Redeem
**Scenario:** Insufficient points for reward.

**Behavior:**
- Show modal: "You need X more points"
- Option: "Pay difference with money" (MVP mock only, no real payment)
- Block redemption if user doesn't accept paying

### 12.5 Brand Changes Rules Mid-Campaign
**Restriction:**
- **BLOCKED** once campaign is `active`
- Can only close (`closed`) prematurely
- Requires creating new campaign for changes

---

## 13. MVP Scope

### 13.1 Included

✅ Complete exchange system
✅ Complete challenge system (multi-day + leaderboard)
✅ Marketplace with filters and AI search
✅ Dynamic level system
✅ Points per brand + rewards store
✅ In-app notifications
✅ Public profiles (portfolio)

### 13.2 Excluded from MVP

❌ **Real social media integrations**
   - No OAuth for Instagram/TikTok
   - No automatic metrics scraping
   - Follower data entered manually

❌ **Real payments**
   - No Stripe/MercadoPago integration
   - Payment flow is mock/simulated

❌ **Shipping logistics**
   - No product shipment tracking
   - Manual brand-user coordination

❌ **Automatic moderation**
   - No inappropriate content detection
   - No automatic compliance verification
   - Manual validation by brand

---

## 14. Success Metrics (KPIs)

### 14.1 Brand Metrics
- Number of campaigns created
- Application acceptance rate
- Average response time to applicants
- Campaign ROI (engagement generated)

### 14.2 User Metrics
- Rate of exchange applications
- Multi-day challenge completion rate
- Level progression (Bronze → Diamond)
- Accumulated points per brand

### 14.3 Platform Metrics
- MAU (Monthly Active Users)
- Submissions per campaign
- Conversion rate (application → acceptance)
- Average time on platform

---

## 15. Post-MVP Roadmap

### Phase 2
- Social media OAuth integration
- Advanced brand analytics
- Brand-user messaging system

### Phase 3
- Real payments (Stripe/MP)
- Brand ↔ User review system
- AI-powered moderation

### Phase 4
- Native mobile app
- Referral program
- Account verification (badge)

---

## 16. UX Design Considerations

### 16.1 Principles
- **Desktop-first:** optimized for large screens
- **Card-based:** visual content in cards (Airbnb inspiration)
- **Clarity:** prominent CTAs, clear visual hierarchy
- **Feedback:** loading states, confirmations, clear errors

### 16.2 Key Components
- **CampaignCard:** title, brand, type, reward, deadline
- **UserCard:** avatar, username, level, followers, engagement
- **LeaderboardRow:** position, user, score, progress
- **RewardCard:** image, title, points cost, availability

---

## 17. Security and Privacy

### 17.1 Authentication
- Hashed passwords (bcrypt)
- JWT for sessions
- Refresh tokens

### 17.2 Authorization
- Row Level Security (RLS) in Supabase
- Brand only sees their campaigns
- User only sees their points/submissions

### 17.3 Sensitive Data
- Email not public
- Followers/metrics optional (user decides)
- Submissions only visible to brand and participant

---

## Appendices

### A. Glossary
- **Exchange:** 1:1 brand-user collaboration (product/$ for content)
- **Challenge:** gamified competition with multiple participants
- **Submission:** content delivery in challenge
- **Score:** 1-100 rating assigned by brand
- **Level:** dynamic user classification (Bronze-Diamond)
- **BrandPoints:** points specific to a brand

### B. Design References
- Airbnb (cards, spacing, typography)
- BigBox (marketplace, filters)
- Duolingo (gamification, leaderboard)

---

**Version:** 1.0  
**Date:** 2026-03-28  
**Status:** Draft for MVP development
