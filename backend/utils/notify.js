// ============================================================
// utils/notify.js — Create / remove notifications
//
// Called from the like, comment and follow controllers.
// Kept separate so those controllers stay focused on their own job.
// ============================================================

const Notification = require("../models/Notification.model");

// Create a notification — unless the user is acting on their own content
// (liking your own post shouldn't notify you).
const notify = async ({ recipient, actor, type, post = null, comment = null }) => {
    if (recipient.toString() === actor.toString()) return;
    await Notification.create({ recipient, actor, type, post, comment });
};

// Remove a notification when its action is undone (unlike, unfollow),
// so the recipient isn't told about something that no longer stands.
const unnotify = async ({ recipient, actor, type, post = null }) => {
    await Notification.deleteMany({ recipient, actor, type, post });
};

module.exports = { notify, unnotify };
