# 📱 Mobile Safari Debugging Guide

This guide will help you debug your LoveLore app on iOS Safari, even though you're developing on Windows.

## 🚀 Quick Start

### 1. Start the Development Server
```bash
# Start with network access (allows mobile connections)
npm run dev:mobile

# Alternative: Start with specific debug configuration
npm run dev:debug
```

### 2. Find Your Computer's IP Address
```bash
ipconfig
```
Look for your IPv4 address (usually something like `192.168.1.xxx`)

### 3. Access from iOS Device
Open Safari on your iOS device and navigate to:
```
http://YOUR_IP_ADDRESS:3000
```

## 🔧 Debug Features

### Automatic Debug Mode (Development)
- **Development**: Debug tools automatically load when `NODE_ENV=development`
- **Visual Indicator**: Green status indicator and full debug panel

### Manual Debug Mode (Production)
- **Production**: Add `?debug=true` to any URL to enable debugging
- **Persistent**: Use localStorage setting to keep debug mode across page loads
- **Visual Indicator**: Yellow status indicator and simplified debug panel

### Mobile Debug Console (Eruda)
- **Triple-tap** anywhere on the page to open the console
- **Debug panel** appears in the top-right corner in debug mode
- **Console, Network, Elements** tabs available for inspection

### Debug Page
Navigate to `/debug` for a comprehensive debug interface:
```
# Development
http://YOUR_IP_ADDRESS:3000/debug

# Production  
https://lovelore.app/debug
https://lovelore.app/debug?debug=true
```

## 🚀 Production Debugging

### Method 1: URL Parameter (Temporary)
Add `?debug=true` to any URL:
```
https://lovelore.app?debug=true
https://lovelore.app/stories/romance-adventure?debug=true
```

### Method 2: Enable Persistent Mode
1. Navigate to the debug page: `https://lovelore.app/debug`
2. Click "Enable Mobile Debug" 
3. Debug tools will stay enabled until you disable them

### Method 3: Console Command
Open browser console and run:
```javascript
localStorage.setItem('mobile-debug', 'true');
window.location.reload();
```

### Method 4: Mobile Triple-Tap
1. First enable debug mode using Method 1, 2, or 3
2. Then triple-tap anywhere on mobile to open the console

## 🔒 Production vs Development Differences

### Development Mode
- ✅ **Automatic activation** - no setup needed
- ✅ **Full debug panel** with all controls
- ✅ **Detailed logging** and error reporting
- ✅ **All debug utilities** available

### Production Mode  
- ⚡ **Manual activation** required (`?debug=true` or localStorage)
- 🎯 **Simplified panel** - less prominent, "Exit Debug" button
- 🔒 **Secure** - only loads when explicitly requested
- ✅ **Same debugging power** - full Eruda console available

## 📋 Available Debug Tools

### 1. Eruda Mobile Console
- **Console**: View logs, errors, warnings
- **Elements**: Inspect DOM elements
- **Network**: Monitor network requests
- **Resources**: Check localStorage, cookies, etc.
- **Info**: View device and browser information

### 2. Debug Utilities
Available in console as `window.debugUtils`:
```javascript
// Log viewport information
debugUtils.logViewport()

// Check performance metrics
debugUtils.logPerformance()

// View memory usage (if available)
debugUtils.logMemory()

// Inspect localStorage
debugUtils.logStorage()
```

### 3. Debug Panel Controls
- **Open Console**: Manually open the debug console
- **Enable**: Enable persistent debugging (survives page reloads)
- **Disable**: Turn off debugging completely

## 🛠 Advanced Usage

### Enable Persistent Debugging
```javascript
localStorage.setItem('mobile-debug', 'true')
```

### URL Parameters
- `?debug=true` - Enable debugging for this session
- Any URL with this parameter will show debug tools

### Console Logging
All console methods work normally:
```javascript
console.log('Debug message')
console.warn('Warning message')
console.error('Error message')
console.info('Info message')
```

## 📱 iOS Safari Specific Tips

### 1. Enable Web Inspector (if you have a Mac)
- Connect iOS device to Mac via USB
- Enable "Web Inspector" in iOS Settings > Safari > Advanced
- Use Safari > Develop > [Device Name] on Mac

### 2. View Console Errors
- With Eruda enabled, all JavaScript errors appear in the mobile console
- Network failures and API errors are logged automatically

### 3. Test Responsive Design
- Use the debug page to view viewport information
- Test different orientations and zoom levels

## 🔍 Debugging Workflows

### Basic Issue Investigation
1. Access `/debug` page first
2. Check system information and environment
3. Enable mobile debug if not already active
4. Use triple-tap to open console
5. Look for errors in Console tab

### Network Request Debugging
1. Open Eruda console
2. Go to "Network" tab
3. Perform the action that's failing
4. Inspect request/response details

### Performance Issues
1. Use `debugUtils.logPerformance()` in console
2. Check memory usage with `debugUtils.logMemory()`
3. Monitor network requests in Network tab

### UI/Layout Issues
1. Use "Elements" tab in Eruda
2. Inspect styles and computed values
3. Test different viewport sizes

## 🚨 Troubleshooting

### Can't Access from Mobile
- Ensure both devices are on the same WiFi network
- Check Windows Firewall settings
- Try different port: `npm run dev -- --port 3001`

### Debug Console Not Appearing
- Clear browser cache and localStorage
- Try adding `?debug=true` to URL
- Check if JavaScript is enabled

### Console Not Responsive
- Refresh the page
- Try disabling and re-enabling debug mode
- Check for JavaScript errors blocking execution

## 📚 Additional Resources

### Alternative Debugging Methods
- **Remote debugging services**: BrowserStack, Sauce Labs
- **Error tracking**: Add Sentry or similar error tracking
- **Network proxy tools**: Charles Proxy, Fiddler

### Browser Dev Tools Alternatives
- **Weinre**: Remote web inspector
- **RemoteJS**: Remote JavaScript console
- **vConsole**: Alternative mobile console

## 🔐 Security Notes

- Debug tools are automatically disabled in production builds
- Never commit `.env` files with debug flags enabled
- Use `?debug=true` parameter only for testing

---

## Quick Reference Commands

```bash
# Start development with mobile access
npm run dev:mobile

# Find IP address
ipconfig

# Access URLs
http://YOUR_IP:3000          # Main app
http://YOUR_IP:3000/debug    # Debug page
http://YOUR_IP:3000?debug=true # Force debug mode
```

**Triple-tap anywhere on mobile to open debug console! 🎯** 