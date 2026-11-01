# Calm Feed for Android

**Instagram on the web with only the accounts you follow, on your Android phone.** Calm Feed is a small userscript that runs on instagram.com in Firefox for Android. It:

- opens your **Following** feed, so you see only accounts you follow, newest first
- hides the **Reels** tab and sends you back to your feed if you land on Reels
- sends the **Explore** grid to the search page, so you can still look people up
- hides **"Suggested for you"** posts and accounts in the feed

It keeps your DMs, Stories, profiles, and reels someone sent you directly.

Using an iPhone? See [Calm Feed](https://github.com/lmxproject/calm-feed).

> Calm Feed is not affiliated with, endorsed by, or connected to Instagram or Meta.

## Privacy

Calm Feed only hides and redirects things on the page you're looking at. It makes **no network requests** and never reads your password, messages, or cookies. You log in on Instagram's own website in Firefox, the same as without it. The whole thing is one readable file: [`calm-feed-android.user.js`](calm-feed-android.user.js).

## Install

Chrome on Android doesn't support extensions, so use **Firefox**.

1. Install **Firefox** from the Play Store.
2. In Firefox, tap **⋮ → Extensions** (or **Add-ons**), find **Violentmonkey**, and tap **Add**. It's free and [open source](https://github.com/violentmonkey/violentmonkey).
3. In Firefox, open this link:
   **https://raw.githubusercontent.com/lmxproject/calm-feed-android/main/calm-feed-android.user.js**
4. Violentmonkey opens an install page. Tap **Install**.
5. Go to **instagram.com** in Firefox and log in.

### Make it feel like an app

1. On instagram.com in Firefox, tap **⋮ → Add to Home screen**.
2. Open Instagram from the new icon and check that the Reels tab is gone.

If the Reels tab shows up when you open the icon, Violentmonkey isn't running there. Delete the icon and open instagram.com in a normal Firefox tab instead (a bookmark or Firefox's shortcuts on the start page work well).

### Keep away from the real app (optional)

- **App timer:** **Settings → Digital Wellbeing & parental controls → Dashboard → Instagram → App timer**.
- **Links:** links to instagram.com in other apps may open the real Instagram app. To keep them in Firefox, go to **Settings → Apps → Instagram → Open by default** and switch **Open supported links** off.

The exact menu names differ a little between phone brands.

## Settings

Open `calm-feed-android.user.js` and change `true` to `false` at the top for anything you want to keep:

```js
const SETTINGS = {
  followingFeed: true, // open the "Following" feed instead of the algorithmic home feed
  hideReels: true,     // hide the Reels tab and leave the Reels page
  hideExplore: true,   // leave the Explore grid for the search page (search keeps working)
  hideSuggested: true, // hide "Suggested for you" posts and accounts in the feed
};
```

**Instagram not in English?** Suggested posts are found by their label text. Add the exact text you see in your language to `SUGGESTED_LABELS`.

## Updates

Calm Feed checks this repository for new versions (`@updateURL`). When Instagram changes its website and something stops working, a fix pushed here reaches your phone automatically. To get it sooner, open Violentmonkey's dashboard in Firefox and tap the update button.

## Known limits

- **Browser only.** It works on the Instagram website in Firefox, not in the Instagram app.
- **No push notifications**, because you're using the website.
- **Instagram changes its site often.** Something may break now and then until the script is updated.
- **The Following feed address** (`/?variant=following`) isn't documented by Instagram. If Instagram ignores it, Calm Feed stops trying after a few attempts, so the page never keeps reloading. You'll then see the normal feed with suggested posts hidden.

## How it works

- **Redirects.** Instagram's website changes pages without reloading, so the script checks the address a few times a second. If you're on `/reels/` or the Explore grid, it sends you on. If Instagram keeps undoing a redirect, the script gives up on that redirect for the rest of the tab.
- **Hiding.** Reels links are hidden by their link address, which changes less often than Instagram's styling. Suggested posts are found by their label. The script then hides that post, or the block around the label that sits between posts, but never anything that contains your normal posts.

## Testing

Open `test/test.html` through a local web server and check that every test passes:

```bash
python3 -m http.server 8765
```

Then visit http://localhost:8765/test/test.html.

## License

[MIT](LICENSE)
