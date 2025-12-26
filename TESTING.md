# Testing Guide for statusnow

## Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:3000`

---

## Test Scenarios

### 1. City Landing Page (`/`)

**Test: Basic Page Load**
- [ ] Page loads with title "Live Visit Status — Bangalore"
- [ ] Subtitle displays correctly
- [ ] Search input is visible with correct placeholder text
- [ ] "Currently tracking: 5 Clinics" text is visible
- [ ] Footer disclaimer is visible at bottom

**Test: Search Functionality**
- [ ] Type "Apollo" → Should show "Apollo Clinic Whitefield"
- [ ] Type "Whitefield" → Should show all 5 clinics
- [ ] Type "Dental" → Should show "Whitefield Dental Care"
- [ ] Type "xyz123" → Should show no results (empty dropdown)
- [ ] Clear search → Dropdown should disappear

**Test: Clinic Selection**
- [ ] Click on any clinic from search results
- [ ] Should navigate to `/clinic/[slug]` page

---

### 2. Clinic Status Page (`/clinic/[slug]`)

**Test: Page Load for New Clinic (No Reports)**
- [ ] Navigate to any clinic (e.g., `/clinic/apollo-clinic-whitefield`)
- [ ] Clinic name and area display correctly
- [ ] Status shows: ⚪ "Not enough live data"
- [ ] Description: "No recent visitor reports yet"
- [ ] Confidence: "No reports in the last 90 minutes"
- [ ] Button shows: "Are you currently here?"
- [ ] Subtext: "Takes 3 seconds · No login needed"
- [ ] Secondary info text is visible

**Test: Back Navigation**
- [ ] Click "← Back to search" button
- [ ] Should return to landing page (`/`)

**Test: Invalid Clinic Slug**
- [ ] Navigate to `/clinic/invalid-slug`
- [ ] Should show "Clinic not found" message
- [ ] "Go back to search" link works

---

### 3. Report Flow

**Test: Complete Report Flow - Waiting**
1. **Initial State**
   - [ ] Click "Are you currently here?" button
   - [ ] Modal/bottom sheet opens

2. **Step 1: Waiting Question**
   - [ ] Question: "Are you currently waiting at this clinic?"
   - [ ] Two buttons: "Yes, waiting" and "No / already seen"
   - [ ] Cancel button is visible

3. **Step 2: Duration (if "Yes, waiting")**
   - [ ] Click "Yes, waiting"
   - [ ] Question changes to: "How long have you been waiting?"
   - [ ] Three buttons: "< 15 min", "15–30 min", "30+ min"

4. **Confirmation**
   - [ ] Click any duration button
   - [ ] Shows: "Thanks. This helps others plan better."
   - [ ] Modal auto-closes after 1 second
   - [ ] Status updates on clinic page

**Test: Complete Report Flow - Not Waiting**
1. Click "Are you currently here?" button
2. Click "No / already seen"
3. [ ] Modal shows confirmation and auto-closes
4. [ ] Status updates on clinic page

**Test: Cancel Report**
- [ ] Open report modal
- [ ] Click "Cancel" button
- [ ] Modal closes without submitting report
- [ ] Status remains unchanged

---

### 4. Status Calculation Logic

**Test: Status Updates Based on Reports**

**Scenario A: First Report**
- [ ] Submit 1 report (any type)
- [ ] Status should be: 🟡 "Some waiting reported"
- [ ] Confidence shows: "Based on 1 report in the last X minutes"

**Scenario B: Multiple Reports - Smooth**
1. Clear localStorage (or use incognito/private window)
2. Submit 2+ reports with "No / already seen" or "< 15 min"
3. [ ] Status should be: 🟢 "Moving smoothly"
4. [ ] Description: "Visitors report little or no waiting right now"

**Scenario C: Heavy Waiting**
1. Clear localStorage
2. Submit 3+ reports with "Yes, waiting" and longer durations
3. [ ] Status should be: 🔴 "Heavy waiting reported"
4. [ ] Description: "Multiple visitors report long waiting"

**Scenario D: Mixed Reports**
1. Clear localStorage
2. Submit mix of waiting and non-waiting reports
3. [ ] Status should reflect majority or waiting signals

---

### 5. Time-Based Restrictions

**Test: 60-Minute Cooldown**
1. Submit a report for a clinic
2. [ ] Button changes to: "You've already shared an update recently. Thanks!"
3. [ ] Button is disabled (grayed out)
4. [ ] Clicking button does nothing
5. Wait 61 minutes (or manually adjust timestamp in localStorage)
6. [ ] Button should be enabled again

**Test: 90-Minute Report Expiry**
1. Submit a report
2. Note the status and confidence
3. Manually edit localStorage to make report 91 minutes old
4. Refresh page
5. [ ] Status should revert to: ⚪ "Not enough live data"
6. [ ] Confidence: "No reports in the last 90 minutes"

**Test: Confidence Time Calculation**
- [ ] Submit a report
- [ ] Confidence should show: "Based on 1 report in the last 0 minutes" (or very small number)
- [ ] Wait a few minutes, refresh
- [ ] Confidence should update: "Based on 1 report in the last X minutes"

---

### 6. Data Persistence

**Test: localStorage Persistence**
1. Submit reports for multiple clinics
2. Refresh the page
3. [ ] All reports persist
4. [ ] Statuses remain correct
5. [ ] Close and reopen browser tab
6. [ ] Data still persists

**Test: Device ID Generation**
1. Open app in new incognito/private window
2. Submit a report
3. [ ] Device ID is generated and stored
4. [ ] Same device ID is used for subsequent reports

---

### 7. Mobile-First Design

**Test: Responsive Layout**
- [ ] Test on mobile viewport (375px width)
- [ ] All text is readable
- [ ] Buttons are easily tappable
- [ ] Modal/bottom sheet works well on mobile
- [ ] No horizontal scrolling
- [ ] Status card is centered and readable

**Test: Touch Interactions**
- [ ] All buttons respond to touch
- [ ] Search input is easy to use on mobile
- [ ] Modal can be dismissed by clicking outside (if implemented)

---

### 8. Edge Cases

**Test: Empty Search**
- [ ] Type and clear search multiple times
- [ ] No errors in console
- [ ] Dropdown appears/disappears smoothly

**Test: Rapid Clicking**
- [ ] Rapidly click report buttons
- [ ] Only one report should be submitted
- [ ] No duplicate reports created

**Test: Multiple Clinics**
- [ ] Submit reports for different clinics
- [ ] Each clinic's status is independent
- [ ] Cooldown is per-clinic (not global)

---

## Quick Test Checklist

Run through this quick checklist to verify core functionality:

1. ✅ Landing page loads and search works
2. ✅ Can navigate to clinic page
3. ✅ Can submit "waiting" report
4. ✅ Can submit "not waiting" report
5. ✅ Status updates after report
6. ✅ Cooldown prevents duplicate reports
7. ✅ Status shows correct emoji and text
8. ✅ Confidence line displays correctly
9. ✅ Reports persist after refresh
10. ✅ Mobile layout looks good

---

## Browser DevTools Testing

**Test localStorage:**
1. Open DevTools → Application → Local Storage
2. Check `rightnow_reports` key (localStorage key remains for backward compatibility)
3. [ ] Reports are stored as JSON array
4. [ ] Each report has: clinicId, timestamp, isWaiting, waitDuration, deviceId
5. Check `rightnow_device_id` key (localStorage key remains for backward compatibility)
6. [ ] Device ID is stored and consistent

**Test Console Errors:**
- [ ] No errors in browser console
- [ ] No warnings about missing keys
- [ ] No React hydration errors

---

## Manual Data Testing

To test different scenarios quickly, you can manually edit localStorage:

1. Open DevTools → Application → Local Storage
2. Edit `rightnow_reports` JSON (localStorage key remains for backward compatibility)
3. Change timestamps to test expiry (use `Date.now() - (minutes * 60 * 1000)`)
4. Refresh page to see updated status

Example report structure:
```json
[
  {
    "clinicId": "1",
    "timestamp": 1234567890000,
    "isWaiting": true,
    "waitDuration": "15–30 min",
    "deviceId": "device_1234567890_abc123"
  }
]
```

---

## Expected Behavior Summary

- **0 reports**: ⚪ Unknown
- **1 report**: 🟡 Some waiting
- **2+ reports (no waiting or <15min)**: 🟢 Smooth
- **3+ reports (with waiting)**: 🔴 Heavy waiting
- **Reports older than 90 min**: Ignored
- **Same device, same clinic, <60 min**: Cooldown active

