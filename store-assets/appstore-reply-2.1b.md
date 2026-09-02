# Reply to App Review — Guideline 2.1(b), Submission 9d736d42-30a4-4cce-85c5-51dc4f20718e

Hello,

Thank you for the review. iTrackHabit has no paid content of any kind — no
premium tier, no subscription, no in-app purchase, and no accounts. Every
feature is free and unlocked on first launch.

Reviewing the submission against your questions, we found three things on our
side that would have made the app look as though it had paid content and
accounts. All three are fixed in this build.

**1. A "Premium" label that gated nothing.** A small "Premium" pill appeared
next to the "AI insights" heading on the Insights tab and in the AI insights
screen header. It was a decorative leftover from an earlier design: it did not
lock anything, nothing behind it was restricted, and it was not attached to any
purchase flow. Both labels are gone, and the word "Premium" no longer appears
anywhere in the interface.

**2. Demo sign-in credentials left in App Review Information.** The submission
still carried a demo username and password in the App Review Information
fields, left over from an early build that had accounts. The app has had no
sign-in for a long time, and those credentials did not correspond to anything.
We have cleared them. We think this is what prompted the question about how
users obtain an account, and we are sorry for the confusion it caused.

**3. A "Synced" indicator for a feature that does not exist.** The home screen
showed a "Synced" pill whenever the device had a network connection. There is
no server and nothing to sync with, so this was simply wrong, and it
contradicted our own review notes stating the app is fully offline. It has been
removed.

Answers to your questions:

**1. Who are the users that will use the paid premium in the app?**

None. There is no paid premium tier in the app. All users have access to every
feature, at no cost, from the moment they install it.

**2. Where can users purchase the premium that can be accessed in the app?**

Nowhere. There is nothing to purchase. We do not sell iTrackHabit or any part of
it on our website, through any other storefront, or through any other channel.

**3. What specific types of previously purchased premium can a user access in
the app?**

None. The app has never had a paid version, and there is no mechanism — in this
version or any previous one — to buy, redeem, restore, or activate paid content.

**4. What paid content, subscriptions, or features are unlocked within the app
that do not use In-App Purchase?**

None. There is no paid content, so nothing bypasses In-App Purchase. The binary
does not link StoreKit, contains no in-app purchase SDK of any kind, and we have
no products configured in App Store Connect. All features — habit tracking,
templates, reminders, focus timer, insights, achievements, and data export — are
free and available immediately.

**5. How do users obtain an account? Do users have to pay a fee to create an
account?**

There are no accounts. The app has no sign-up, no sign-in, and no user profiles
on any server. Opening the app takes the user straight to the habit list. All
data is stored in a local SQLite database on the device, the app works fully
offline with no backend server, and no fee is charged at any point. The demo
credentials described above were an error in our submission form, not a sign-in
that exists in the app.

We have also replaced the App Store screenshots, which were out of date and in
one size still showed the "Premium" label described above.

We are happy to provide any further detail you need.

Kind regards,
Bishnu Aryal
BISZAAL TECH LTD
