# Walkthrough - Branding Update & Production Hardening

I have updated the system branding and continued the hardening process for production deployment.

## Key Changes

### 1. Custom Branding (Logo)
- **New Visual Identity**: Replaced the default Lucide Zap icon with your provided Maguindanao Electric Coop Logo (`logo.jpg`).
- **Resilient Implementation**: Added an `onError` fallback mechanism. If the logo file is missing or fails to load, the system will automatically revert to the original high-tech Zap icon, ensuring the UI never looks broken.
- **Styling**: The logo is rendered with a clean circular crop and subtle border to match the refined NextGen/Legacy UI aesthetic.

### 2. Ongoing Production Prep
- **Migration Hidden**: Confirmed the "Migration" settings option is hidden from the Navbar to prevent accidental data overwrites in production.
- **Hardware Mode Locked**: The system remains locked in `legacy` mode with the toggle hidden, as per previous instructions for the current production push.

## How to Verify
1.  **Dashboard/Navbar**: Refresh the page. You should see the new round logo in the top-left corner.
2.  **Toggle**: Confirm that the Wifi toggle remains hidden.
3.  **Settings**: Click the Settings dropdown; "Migration" should not be listed.

> [!TIP]
> To update the logo in the future, simply replace `/public/logo.jpg` with a new image of the same name.
