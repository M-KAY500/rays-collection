/* =========================================================
   Ray's Collection — admin authentication
   Backed by Supabase Auth (email + password). The client-side
   allow-list below is just a friendly UX check — the real
   security boundary is the RLS policy in supabase-setup.sql,
   which only lets this exact email write to the catalog.
   ========================================================= */

const RC_ALLOWED_EMAIL = "yeboahrachel383@gmail.com";

/* Returns { ok, error } — never echoes the password back. */
async function rcSignUp(email, password, confirm) {
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!cleanEmail || !password || !confirm) {
    return { ok: false, error: "Please fill in every field." };
  }
  if (cleanEmail !== RC_ALLOWED_EMAIL) {
    return { ok: false, error: "This email is not authorised for an admin account." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }
  if (password !== confirm) {
    return { ok: false, error: "Passwords do not match." };
  }

  const { error } = await rcSupabase.auth.signUp({
    email: cleanEmail,
    password
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function rcLogin(email, password) {
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!cleanEmail || !password) {
    return { ok: false, error: "Please enter your email and password." };
  }

  const { error } = await rcSupabase.auth.signInWithPassword({
    email: cleanEmail,
    password
  });

  if (error) return { ok: false, error: "Incorrect email or password." };
  return { ok: true };
}

async function rcIsLoggedIn() {
  const { data } = await rcSupabase.auth.getSession();
  return !!data.session;
}

async function rcCurrentAdminEmail() {
  const { data } = await rcSupabase.auth.getSession();
  return data.session?.user?.email || "";
}

async function rcLogout() {
  await rcSupabase.auth.signOut();
}

/* Call at the top of any protected admin page. Redirects if not
   signed in, otherwise resolves once the check is done. */
async function rcRequireAuth() {
  const loggedIn = await rcIsLoggedIn();
  if (!loggedIn) {
    window.location.href = "admin-login.html";
  }
  return loggedIn;
}
