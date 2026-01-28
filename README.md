# Research Lab Tracker ðŸ”¬

A comprehensive web-based tool for tracking research goals, activities, and publications for academic labs. Perfect for principal investigators and their students to collaborate and monitor progress with **real-time data synchronization**.

## Features

âœ… **Real-time Collaboration** - All lab members see the same data
âœ… **Automatic Sync** - Data syncs via GitHub Gists
âœ… **Weekly & Monthly Goals** - Set and track time-bound research objectives
âœ… **Activity Logging** - Record daily research activities and progress
âœ… **Publication Tracker** - Manage papers from draft to publication
âœ… **Student Dashboard** - Individual views for each lab member
âœ… **Progress Visualization** - Charts and progress indicators
âœ… **Data Export/Import** - Backup and restore your data
âœ… **No Backend Required** - Uses GitHub Gists as database
- **PI Workspace** - Private goals, notes, and to-dos stored only on your device

## Quick Setup (5 minutes)

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `research-lab-tracker`
3. Make it **Public** (required for GitHub Pages)
4. Click "Create repository"
5. Upload all files from this project

### Step 2: Enable GitHub Pages

1. Go to repository **Settings** â†’ **Pages**
2. Source: "Deploy from a branch"
3. Branch: `main`, folder: `/ (root)`
4. Click **Save**
5. Wait 2-3 minutes
6. Your site will be at: `https://yourusername.github.io/research-lab-tracker`

### Step 3: Set Up Data Synchronization

#### A. Create GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click **"Generate new token"** â†’ **"Generate new token (classic)"**
3. Note: `Research Lab Tracker`
4. Expiration: `No expiration` or `1 year`
5. Select scopes: âœ… **`gist`** (only this one needed)
6. Click **"Generate token"**
7. **COPY THE TOKEN** - you'll only see it once! (starts with `ghp_...`)

#### B. Create GitHub Gist (Data Storage)

1. Go to https://gist.github.com/
2. Click **"+ New gist"** (top right)
3. Filename: `research-lab-data.json`
4. Content: Paste this:
   ```json
   {
     "students": [],
     "goals": [],
     "activities": [],
     "publications": []
   }
   ```
5. Create **SECRET gist** (important for privacy!)
6. Click **"Create secret gist"**
7. **COPY THE GIST ID** from URL: `https://gist.github.com/yourusername/[THIS-IS-THE-ID]`

#### C. Configure the App

1. Open your deployed site: `https://yourusername.github.io/research-lab-tracker`
2. Click **"âš™ï¸ Setup Sync"** button (top right)
3. Enter:
   - **GitHub Token**: Paste your token (`ghp_...`)
   - **Gist ID**: Paste your gist ID
4. Click **"Save & Connect"**
5. âœ… You should see "âœ“ Connected" status

### Step 4: Share with Students

Send your students:
1. **App URL**: `https://yourusername.github.io/research-lab-tracker`
2. **GitHub Token**: The same token you created
3. **Gist ID**: The same gist ID

**Each student needs to:**
1. Visit the app URL
2. Click "âš™ï¸ Setup Sync"
3. Enter the same token and gist ID
4. Now everyone sees the same data! ðŸŽ‰

## Usage Guide

### First Time Setup (Lab PI)

1. **Set up sync** (follow Step 3 above)
2. **Add lab members**: Go to "Students" tab â†’ Add each student
3. **Set initial goals**: Create first weekly/monthly goals
4. **Share access**: Give students the URL, token, and gist ID

### For Students

1. Visit the app URL
2. Enter sync credentials (token + gist ID) - one time only
3. Start logging activities and updating goals
4. All changes sync automatically!

### Weekly Workflow

1. **Monday**: PI sets weekly goals for each student
2. **Daily**: Students log research activities and progress
3. **Update goals**: Mark completed, add notes
4. **Friday**: Review completion status together
5. **Monthly**: Set monthly objectives and review achievements

### PI Workspace (Private Only)

- Open the **PI Workspace** tab for a personal dashboard that only lives in your browser.
- Track private academic goals, work log entries, and personal to-do items without sharing them via GitHub.
- Use the Export/Import buttons in that tab to create JSON backups you can store safely elsewhere.
- Clearing browser data or switching computers will remove this private workspace unless you import a backup file.


## Features Guide

### ðŸ“Š Dashboard
- Overview of all active goals
- Recent activities from all lab members
- Publication statistics
- Quick completion actions

### ðŸŽ¯ Goals
- Create weekly or monthly goals
- Assign to specific students
- Set deadlines and track progress
- Mark as completed
- Filter by type, student, or status

### ðŸ“ Activities
- Log daily research work
- Record hours spent
- Add detailed descriptions
- Filter by student or date
- View timeline of all activities

### ðŸ“š Publications
- Track papers through pipeline
- Statuses: Draft â†’ In Progress â†’ Submitted â†’ Under Review â†’ Accepted â†’ Published
- Store DOI/URLs
- Add notes and deadlines
- Filter by status

### ðŸ‘¥ Students
- Manage lab members
- Different roles: PhD, Master's, Undergraduate, Postdoc, PI
- Contact information
- Easy management

## Data Synchronization

### How It Works
- Data stored in a private GitHub Gist
- App reads/writes to Gist via GitHub API
- Changes sync every 30 seconds automatically
- Manual sync with "ðŸ”„ Sync Now" button

### Sync Status Indicators
- **ðŸŸ¢ Connected**: Sync working properly
- **ðŸŸ¡ Syncing**: Data being synchronized
- **ðŸ”´ Disconnected**: Check credentials or internet
- **Last sync**: Shows time of last successful sync

### Troubleshooting Sync

**"Sync failed" error:**
- Check internet connection
- Verify token hasn't expired
- Confirm gist ID is correct
- Regenerate token if needed

**Data not appearing:**
- Wait 30 seconds for auto-sync
- Click "ðŸ”„ Sync Now" button
- Check all users have same gist ID
- Verify gist contains valid JSON

**Changes not saving:**
- Check sync status is "Connected"
- Ensure token has `gist` scope
- Try disconnecting and reconnecting

## Security & Privacy

### Token Safety
- âš ï¸ **Never share tokens publicly** (only with your lab members)
- Store token securely
- Can revoke and regenerate anytime at https://github.com/settings/tokens
- Each lab should have unique token

### Data Privacy
- Use **SECRET gist** (not public)
- Only people with token + gist ID can access
- No data stored on external servers (only GitHub)
- Export regularly for backup

### Best Practices
- Change token every 6-12 months
- Don't commit token to public repositories
- Each lab member stores credentials locally (browser)
- Regular backups via Export function

## Backup & Export

### Manual Backup
1. Click **"ðŸ“¤ Export Data"**
2. Saves JSON file with all data
3. Store in safe location
4. Can import anytime

### Auto-Backup (Recommended)
- Data already backed up in GitHub Gist
- View/download from: `https://gist.github.com/yourusername/[gist-id]`
- Gist has version history

### Restore from Backup
1. Click **"ðŸ“¥ Import Data"**
2. Select JSON backup file
3. Confirm replacement
4. Data syncs to all devices

## Customization

### Change Colors (University Branding)
Edit `styles.css`:
```css
:root {
    --primary-color: #2563eb;     /* Main color */
    --secondary-color: #7c3aed;   /* Accent color */
}
```

### Change Lab Name
Edit `index.html`:
```html
<h1>ðŸ”¬ Your Lab Name Here</h1>
```

### Adjust Sync Interval
Edit `app.js`:
```javascript
const SYNC_INTERVAL = 30000; // milliseconds (30 seconds default)
```

## Advanced Usage

### Multiple Labs
- Each lab needs unique gist
- Use different tokens for security
- Can deploy multiple instances

### Offline Mode
- App caches data locally
- Works without internet
- Syncs when connection restored

### Mobile Usage
- Fully responsive design
- Works on phones and tablets
- Save to home screen (PWA-like)

## Browser Compatibility

- âœ… Chrome/Edge (recommended)
- âœ… Firefox  
- âœ… Safari
- âœ… Mobile browsers
- Requires JavaScript enabled
- Needs localStorage support

## Troubleshooting

### Sync Issues
| Problem | Solution |
|---------|----------|
| Not syncing | Check token & gist ID in settings |
| Old data showing | Click "ðŸ”„ Sync Now" or refresh page |
| Sync failed | Verify token hasn't expired |
| Slow sync | Check internet connection |

### GitHub Pages Issues
| Problem | Solution |
|---------|----------|
| 404 error | Wait 5-10 minutes after enabling Pages |
| Not updating | Check main branch has latest files |
| Mixed content | Ensure repository is public |

### Data Issues
| Problem | Solution |
|---------|----------|
| Data disappeared | Import from backup or check gist |
| Duplicate entries | Clear browser cache, re-sync |
| Can't add items | Check sync is connected |

## FAQ

**Q: Is this free?**  
A: Yes! Uses free GitHub features only.

**Q: How many students can use it?**  
A: Unlimited. GitHub Gists support any number of collaborators.

**Q: Is data secure?**  
A: Yes, if you use a SECRET gist and don't share tokens publicly.

**Q: What if token expires?**  
A: Generate new token, update in settings, share with lab.

**Q: Can I use without sync?**  
A: Yes, but data stays local (not collaborative).

**Q: Does it work offline?**  
A: Basic features yes, but sync needs internet.

**Q: Can I migrate to my own server later?**  
A: Yes, export data and use with any backend.

## Support

- **Issues**: Open issue in this repository
- **Questions**: Check FAQ above
- **Feature requests**: Submit via GitHub issues

## License

MIT License - Free to use and modify

## Credits

Built for research labs worldwide ðŸŒ  
Helping scientists track goals and stay productive ðŸ”¬

---

**Version 2.0** - Now with real-time collaboration! ðŸŽ‰
