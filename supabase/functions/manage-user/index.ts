import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify the caller is an authenticated admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Client with the caller's JWT — used to verify their identity + role
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: callerAuth }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !callerAuth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin client — has service_role, can create/delete auth users
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check caller is an admin in our users table
    const { data: callerProfile, error: profileErr } = await adminClient
      .from('users')
      .select('role')
      .eq('auth_id', callerAuth.id)
      .maybeSingle();

    if (profileErr || !callerProfile || callerProfile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const method = req.method;
    const body = method !== 'DELETE' ? await req.json() : null;
    const url = new URL(req.url);
    const targetId = url.searchParams.get('id'); // user id for UPDATE and DELETE

    // ── CREATE ──────────────────────────────────────────────────────────────
    if (method === 'POST') {
      const { login, pass, name, role, permissions } = body;

      if (!login || !pass || !name) {
        return new Response(JSON.stringify({ error: 'login, pass va name majburiy' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check login uniqueness
      const { data: existing } = await adminClient
        .from('users')
        .select('id')
        .eq('login', login.trim().toLowerCase())
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ error: `"${login}" login allaqachon mavjud` }), {
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create Supabase Auth user
      const email = `${login.trim().toLowerCase()}@kael.local`;
      const { data: authUser, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password: pass,
        email_confirm: true,
      });

      if (createErr || !authUser.user) {
        return new Response(JSON.stringify({ error: createErr?.message || 'Auth user yaratib bo\'lmadi' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Insert into our users table
      const { data: newUser, error: insertErr } = await adminClient
        .from('users')
        .insert({
          login: login.trim().toLowerCase(),
          pass: '••••••••', // never store plaintext — actual auth is via Supabase Auth
          name,
          role: role || 'sotuvchi',
          permissions: permissions || [],
          auth_id: authUser.user.id,
        })
        .select()
        .single();

      if (insertErr) {
        // Rollback: delete the auth user we just created
        await adminClient.auth.admin.deleteUser(authUser.user.id);
        return new Response(JSON.stringify({ error: insertErr.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ user: newUser }), {
        status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── UPDATE ──────────────────────────────────────────────────────────────
    if (method === 'PUT') {
      if (!targetId) {
        return new Response(JSON.stringify({ error: 'id parametri kerak' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { login, pass, name, role, permissions } = body;

      // Fetch the target user
      const { data: target, error: fetchErr } = await adminClient
        .from('users')
        .select('*')
        .eq('id', targetId)
        .maybeSingle();

      if (fetchErr || !target) {
        return new Response(JSON.stringify({ error: 'Foydalanuvchi topilmadi' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Protect: can't demote the primary admin
      if (target.role === 'admin' && role && role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Asosiy admin rolini o\'zgartirib bo\'lmaydi' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // If password changed and user has an auth account, update it
      if (pass && target.auth_id) {
        const { error: passErr } = await adminClient.auth.admin.updateUserById(target.auth_id, {
          password: pass,
        });
        if (passErr) {
          return new Response(JSON.stringify({ error: passErr.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Update profile row
      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (role !== undefined) updates.role = role;
      if (permissions !== undefined) updates.permissions = permissions;
      if (login !== undefined) updates.login = login.trim().toLowerCase();
      // Never update pass column — auth is via Supabase Auth

      const { data: updatedUser, error: updateErr } = await adminClient
        .from('users')
        .update(updates)
        .eq('id', targetId)
        .select()
        .single();

      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ user: updatedUser }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── DELETE ──────────────────────────────────────────────────────────────
    if (method === 'DELETE') {
      if (!targetId) {
        return new Response(JSON.stringify({ error: 'id parametri kerak' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch target user
      const { data: target, error: fetchErr } = await adminClient
        .from('users')
        .select('*')
        .eq('id', targetId)
        .maybeSingle();

      if (fetchErr || !target) {
        return new Response(JSON.stringify({ error: 'Foydalanuvchi topilmadi' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Protect: can't delete an admin account
      if (target.role === 'admin') {
        return new Response(JSON.stringify({ error: 'Admin akkauntini o\'chirib bo\'lmaydi' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Delete auth user first (if linked)
      if (target.auth_id) {
        const { error: deleteAuthErr } = await adminClient.auth.admin.deleteUser(target.auth_id);
        if (deleteAuthErr) {
          return new Response(JSON.stringify({ error: deleteAuthErr.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Delete from users table
      const { error: deleteErr } = await adminClient
        .from('users')
        .delete()
        .eq('id', targetId);

      if (deleteErr) {
        return new Response(JSON.stringify({ error: deleteErr.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server xatosi' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
