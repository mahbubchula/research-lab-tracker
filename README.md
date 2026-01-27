# Research Lab Tracker 🔬

A comprehensive web-based tool for tracking research goals, activities, and publications for academic labs. Perfect for principal investigators and their students to collaborate and monitor progress.

## Features

✅ **Weekly & Monthly Goals** - Set and track time-bound research objectives
✅ **Activity Logging** - Record daily research activities and progress
✅ **Publication Tracker** - Manage papers from draft to publication
✅ **Student Dashboard** - Individual views for each lab member
✅ **Progress Visualization** - Charts and progress indicators
✅ **Data Export/Import** - Backup and restore your data
✅ **Collaborative** - All lab members can view and update
✅ **No Backend Required** - Runs entirely in the browser

## Quick Start

### Option 1: GitHub Pages (Recommended)

1. Fork or clone this repository
2. Go to Settings → Pages
3. Source: Deploy from branch `main`
4. Folder: `/ (root)`
5. Save and wait a few minutes
6. Access at: `https://yourusername.github.io/research-lab-tracker`

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/research-lab-tracker.git
cd research-lab-tracker

# Open with a local server (Python example)
python -m http.server 8000

# Or use Node.js
npx serve

# Visit http://localhost:8000
```

## Usage Guide

### First Time Setup

1. **Add Lab Members**: Click "Settings" → Add student names
2. **Set Initial Goals**: Create your first weekly/monthly goals
3. **Start Tracking**: Log activities and update progress

### Weekly Workflow

1. **Monday**: Set weekly goals for each student
2. **Daily**: Log research activities and progress
3. **Friday**: Review completion status
4. **Monthly**: Set monthly objectives and review past month

### Publication Tracking

- **Draft**: Initial writing phase
- **In Progress**: Active development
- **Submitted**: Under journal review
- **Under Review**: Peer review stage
- **Published**: Accepted and published

## Data Management

### Storage
- Data is stored in browser's localStorage
- Each browser/device has separate storage
- Export regularly for backup

### Export Data
1. Click "Export Data" button
2. Save the JSON file
3. Store in a safe location

### Import Data
1. Click "Import Data" button
2. Select your JSON backup file
3. Data will be restored

### Sync Across Devices (Optional)
- Export from Device A
- Import to Device B
- Or use GitHub Gists (see Advanced Usage)

## Customization

### Colors & Branding
Edit `styles.css`:
```css
:root {
    --primary-color: #2563eb; /* Change to your university colors */
    --secondary-color: #7c3aed;
}
```

### Lab Information
Edit `index.html`:
```html
<h1>Your Lab Name</h1>
```

## Advanced Usage

### GitHub Gist Sync (Optional)

For automatic cloud sync across devices:

1. Create a GitHub Personal Access Token
2. Create a private Gist
3. Add sync functionality (see `sync-addon.js`)

### Custom Fields

Add custom tracking fields by editing `app.js`:
```javascript
// Add to goal object
customField: document.getElementById('custom-field').value
```

## Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Troubleshooting

### Data Not Saving
- Check browser localStorage is enabled
- Clear cache and reload
- Try a different browser

### GitHub Pages Not Working
- Ensure repository is public
- Check Pages settings are correct
- Wait 5-10 minutes after enabling

### Import Fails
- Verify JSON file format
- Check file isn't corrupted
- Try a different export

## Security & Privacy

- All data stored locally in your browser
- No data sent to external servers
- Export files contain sensitive research info - protect them
- Use private repository if needed (requires GitHub Pro for Pages)

## Contributing

Feel free to fork and customize for your lab's needs!

## License

MIT License - Feel free to use and modify

## Support

For issues or questions, open a GitHub issue in this repository.

---

**Made with ❤️ for research labs worldwide**
