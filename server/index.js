import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_PORT = process.env.FRONTEND_PORT || PORT;

// Функция для проверки, является ли пользователь администратором
const checkIfUserIsAdmin = async (telegramId) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        role_id,
        roles(name)
      `)
      .eq('telegram_id', telegramId)
      .eq('roles.name', 'admin')
      .single();

    if (error) {
      console.log('❌ Error checking admin status:', error.message);
      return false;
    }

    return user && user.roles && user.roles.name === 'admin';
  } catch (err) {
    console.log('❌ Exception checking admin status:', err.message);
    return false;
  }
};

// Функция автопубликации постов
const autoPublishOverduePosts = async () => {
  try {
    const now = new Date();
    console.log(`🔄 Checking for overdue posts at ${now.toISOString()} (${now.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })})...`);
    
    // Сначала проверим все запланированные посты для отладки
    const { data: allScheduledPosts, error: debugError } = await supabase
      .from('content')
      .select('*')
      .eq('is_scheduled', true)
      .not('scheduled_at', 'is', null);
    
    if (debugError) {
      console.error('❌ Debug error:', debugError);
    } else {
      console.log(`🔍 Found ${allScheduledPosts?.length || 0} total scheduled posts:`);
      if (allScheduledPosts) {
        allScheduledPosts.forEach(post => {
          const scheduledTime = new Date(post.scheduled_at);
          const timeDiff = scheduledTime.getTime() - now.getTime();
          const status = timeDiff <= 0 ? 'ПРОСРОЧЕН' : 'ОЖИДАЕТ';
          console.log(`  - "${post.title}" [${post.status}] scheduled for ${post.scheduled_at} (${timeDiff <= 0 ? Math.abs(timeDiff/1000).toFixed(0) + 's overdue' : Math.ceil(timeDiff/1000/60) + 'min remaining'})`);
        });
      }
    }
    
    // Находим посты, которые должны быть опубликованы прямо сейчас
    // ПРОБЛЕМА: scheduled_at хранится в UTC, поэтому сравниваем напрямую с Date объектами
    const { data: overduePosts, error: findError } = await supabase
      .from('content')
      .select('*')
      .eq('status', 'scheduled')
      .eq('is_scheduled', true)
      .not('scheduled_at', 'is', null);

    if (findError) {
      console.error('❌ Error finding scheduled posts:', findError);
      console.error('🔍 Error details:', findError.message);
      return 0;
    }

    // Фильтруем просроченные посты на уровне приложения для точности
    const overduePostsFiltered = overduePosts ? overduePosts.filter(post => {
      const scheduledTime = new Date(post.scheduled_at);
      return scheduledTime <= now;
    }) : [];

    if (overduePostsFiltered.length === 0) {
      console.log('✅ No overdue posts found');
      return 0;
    }

    console.log(`📅 Found ${overduePostsFiltered.length} overdue posts, publishing...`);
    overduePostsFiltered.forEach(post => {
      const scheduledTime = new Date(post.scheduled_at);
      const timeDiff = Math.abs(now.getTime() - scheduledTime.getTime()) / 1000;
      const moscowScheduled = new Date(scheduledTime.getTime() + (3 * 60 * 60 * 1000)); // +3 часа для МСК
      console.log(`  - "${post.title}" (scheduled for ${post.scheduled_at}, ${moscowScheduled.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}, ${timeDiff.toFixed(0)}s overdue)`);
    });

    // Обновляем статус всех просроченных постов
    const postIds = overduePostsFiltered.map(post => post.id);
    const { data: updatedPosts, error: updateError } = await supabase
      .from('content')
      .update({
        status: 'published',
        is_scheduled: false,
        scheduled_at: null,
        published_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .in('id', postIds)
      .select();

    if (updateError) {
      console.error('❌ Error updating overdue posts:', updateError);
      return 0;
    }

    const publishedCount = updatedPosts?.length || 0;
    console.log(`✅ Successfully auto-published ${publishedCount} posts at ${now.toISOString()} (${now.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })})`);
    return publishedCount;
  } catch (error) {
    console.error('💥 Error in autoPublishOverduePosts:', error);
    return 0;
  }
};

// Запускаем автопубликацию каждый час для оптимального баланса между точностью и производительностью
const autoPublishInterval = setInterval(autoPublishOverduePosts, 60 * 60 * 1000);

// Запускаем первую проверку через 10 секунд после старта сервера
setTimeout(() => {
  console.log('🚀 Starting initial auto-publish check...');
  autoPublishOverduePosts();
}, 10000);

// Security middleware - настроенный для работы с внешними изображениями
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://telegram.org"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:", "blob:", 
               "https://i.postimg.cc", 
               "https://ui-avatars.com"],
      connectSrc: ["'self'", "https:", "wss:"]
    }
  }
}));

// Trust proxy for rate limiting (fixes X-Forwarded-For warning)
app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] // Replace with your production domain
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Rate limiting - более мягкие ограничения для разработки
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // увеличиваем лимит для разработки
  message: 'Too many requests from this IP',
  skip: (req) => {
    // Пропускаем rate limiting для localhost в development
    if (process.env.NODE_ENV === 'development' && 
        (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip?.includes('localhost'))) {
      return true;
    }
    return false;
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware для автоматического обновления времени последнего входа
const updateLastLoginMiddleware = async (req, res, next) => {
  // Получаем telegram_id из заголовков или параметров запроса
  const telegramId = req.headers['x-telegram-id'] || req.query.telegram_id || req.body?.telegram_id;
  
  // Обновляем время последнего входа только для API запросов с telegram_id
  if (telegramId && req.path.startsWith('/api/')) {
    // Запускаем обновление асинхронно, чтобы не замедлять ответ
    updateUserLastLogin(telegramId).catch(err => {
      console.error('❌ Error in updateLastLoginMiddleware:', err);
    });
  }
  
  next();
};

// Применяем middleware для всех API запросов
app.use('/api/', updateLastLoginMiddleware);

// Middleware to check admin access
const checkAdminAccess = async (req, res, next) => {
  const telegramId = req.headers['x-telegram-id'] || req.query.telegram_id;
  
  if (!telegramId) {
    return res.status(401).json({ 
      error: 'Telegram ID required for admin access' 
    });
  }

  const telegramIdNumber = parseInt(telegramId);
  const isAdmin = await checkIfUserIsAdmin(telegramIdNumber);
  
  if (!isAdmin) {
    return res.status(403).json({ 
      error: 'Access denied. Admin privileges required.' 
    });
  }

  next();
};

// API Routes

// Get user activity statistics endpoint
app.get('/api/admin/users/activity-stats', checkAdminAccess, async (req, res) => {
  try {
    console.log('📊 Admin activity stats request:', {
      headers: req.headers,
      telegramId: req.headers['x-telegram-id'],
      timestamp: new Date().toISOString()
    });

    // Получаем статистику активности пользователей
    const { data: stats, error } = await supabase.rpc('get_user_activity_summary');

    if (error) {
      console.error('❌ Activity stats error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch activity statistics',
        details: error.message 
      });
    }

    console.log('✅ Activity stats retrieved:', stats?.[0]);
    res.json({ 
      stats: stats?.[0] || {
        total_users: 0,
        users_with_first_login: 0,
        active_today: 0,
        active_week: 0,
        active_month: 0,
        inactive_users: 0,
        never_logged_in: 0
      }
    });
  } catch (error) {
    console.error('💥 Server error in activity stats:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

app.get('/api/admin/users', checkAdminAccess, async (req, res) => {
  try {
    console.log('🔍 Admin users request:', {
      headers: req.headers,
      telegramId: req.headers['x-telegram-id'],
      timestamp: new Date().toISOString()
    });

    // Проверяем подключение к Supabase
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Supabase connection test failed:', testError);
      return res.status(500).json({ 
        error: 'Database connection failed',
        details: testError.message,
        debug: {
          supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
          supabaseKey: supabaseKey ? 'Set' : 'Missing',
          testError: testError
        }
      });
    }

    console.log('✅ Supabase connection test passed');

    // Получаем параметры пагинации из запроса
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    console.log('📊 Pagination params:', { limit, offset });

    // Получаем общее количество пользователей
    const { count: totalCount, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Count query error:', countError);
      return res.status(500).json({ 
        error: 'Failed to count users',
        details: countError.message
      });
    }

    // Получаем пользователей с пагинацией
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        telegram_id,
        username,
        first_name,
        last_name,
        language_code,
        role_id,
        roles(name, description, color),
        created_at,
        updated_at,
        first_login_at,
        last_login_at
      `)
      .order('last_login_at', { ascending: false, nullsLast: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Supabase query error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch users from database',
        details: error.message,
        debug: {
          error: error,
          query: 'SELECT * FROM users ORDER BY created_at DESC'
        }
      });
    }

    console.log(`📊 Found ${users?.length || 0} users (showing ${offset + 1}-${offset + (users?.length || 0)} of ${totalCount || 0})`);

    // Transform data to match the expected format
    const transformedUsers = (users || []).map(user => ({
      id: user.id,
      telegram_id: user.telegram_id,
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name || 'User')}&background=007bff&color=fff`,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      language_code: user.language_code,
      role: user.roles ? user.roles.name : '',
      role_id: user.role_id,
      created_at: user.created_at,
      updated_at: user.updated_at,
      first_login_at: user.first_login_at,
      last_login_at: user.last_login_at
    }));

    console.log('🔍 Transformed users data:', transformedUsers.map(u => ({
      id: u.id,
      telegram_id: u.telegram_id,
      role: u.roles ? u.roles.name : '',
      role_id: u.role_id
    })));

    console.log('✅ Sending users data to client');
    res.json({ 
      users: transformedUsers,
      total: totalCount || 0
    });
  } catch (error) {
    console.error('💥 Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      debug: {
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Check if user exists endpoint
app.get('/api/users/check/:telegram_id', async (req, res) => {
  try {
    const { telegram_id } = req.params;

    if (!telegram_id) {
      return res.status(400).json({ 
        error: 'telegram_id is required' 
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id, 
        telegram_id, 
        role_id,
        roles(name, description, color),
        created_at,
        first_login_at,
        last_login_at
      `)
      .eq('telegram_id', parseInt(telegram_id))
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ User check error:', error);
      return res.status(500).json({ 
        error: 'Failed to check user',
        details: error.message 
      });
    }

    // Если пользователь существует, обновляем время последнего входа
    if (user) {
      await updateUserLastLogin(telegram_id);
    }

    res.json({ 
      exists: !!user,
      user: user || null
    });
  } catch (error) {
    console.error('💥 Server error during user check:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Функция для обновления времени последнего входа пользователя
const updateUserLastLogin = async (telegramId) => {
  try {
    const { error } = await supabase.rpc('update_user_last_login', {
      user_telegram_id: parseInt(telegramId)
    });

    if (error) {
      console.error('❌ Error updating last login:', error);
    } else {
      console.log(`✅ Updated last login for user ${telegramId}`);
    }
  } catch (err) {
    console.error('💥 Exception updating last login:', err);
  }
};

// User registration endpoint
app.post('/api/users/register', async (req, res) => {
  try {
    const { telegram_id, username, first_name, last_name, language_code } = req.body;

    if (!telegram_id) {
      return res.status(400).json({ 
        error: 'telegram_id is required' 
      });
    }

    console.log('📝 User registration request:', {
      telegram_id,
      username,
      first_name,
      last_name,
      language_code,
      role: 'No role assigned on registration', // Always empty on registration
      timestamp: new Date().toISOString()
    });

    // Сначала проверяем, существует ли пользователь
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, telegram_id, first_login_at, last_login_at')
      .eq('telegram_id', parseInt(telegram_id))
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ User check error:', checkError);
      return res.status(500).json({ 
        error: 'Failed to check existing user',
        details: checkError.message 
      });
    }

    // Если пользователь уже существует, обновляем время последнего входа
    if (existingUser) {
      console.log('👤 User already exists:', existingUser.id);
      
      // Обновляем время последнего входа
      await updateUserLastLogin(telegram_id);
      
      return res.json({ 
        user: existingUser,
        isNew: false
      });
    }

    // Создаем нового пользователя
    const now = new Date().toISOString();
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        telegram_id: parseInt(telegram_id),
        username: username || null,
        first_name: first_name || null,
        last_name: last_name || null,
        language_code: language_code || null,
        first_login_at: now,
        last_login_at: now
        // role будет автоматически установлено в '' благодаря DEFAULT
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ User registration error:', insertError);
      return res.status(500).json({ 
        error: 'Failed to register user',
        details: insertError.message 
      });
    }

    console.log('✅ New user registered successfully:', newUser.id);
    
    res.json({ 
      user: newUser,
      isNew: true
    });
  } catch (error) {
    console.error('💥 Server error during registration:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});




// Get all roles endpoint with pagination
app.get('/api/admin/roles', checkAdminAccess, async (req, res) => {
  try {
    // Получаем параметры пагинации
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    console.log('🔍 Admin roles request:', {
      headers: req.headers,
      telegramId: req.headers['x-telegram-id'],
      limit,
      offset,
      timestamp: new Date().toISOString()
    });

    // Получаем общее количество ролей
    const { count: totalCount, error: countError } = await supabase
      .from('roles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Supabase roles count error:', countError);
      return res.status(500).json({ 
        error: 'Failed to count roles from database',
        details: countError.message
      });
    }

    // Получаем роли с пагинацией
    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Supabase roles query error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch roles from database',
        details: error.message
      });
    }

    console.log(`📊 Found ${roles?.length || 0} roles (${offset + 1}-${offset + (roles?.length || 0)} of ${totalCount || 0})`);
    res.json({ 
      roles: roles || [],
      total: totalCount || 0
    });
  } catch (error) {
    console.error('💥 Server error in roles:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Create role endpoint
app.post('/api/admin/roles', checkAdminAccess, async (req, res) => {
  try {
    const { name, description, color } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ 
        error: 'Role name is required and must be a non-empty string' 
      });
    }

    console.log('📝 Role creation request:', {
      name: name.trim(),
      description,
      color: color || '#28a745',
      timestamp: new Date().toISOString()
    });

    const { data: newRole, error: insertError } = await supabase
      .from('roles')
      .insert({
        name: name.trim().toLowerCase(),
        description: description || null,
        color: color || '#28a745'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Role creation error:', insertError);
      
      if (insertError.code === '23505') { // Unique violation
        return res.status(400).json({ 
          error: 'Роль с таким названием уже существует'
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to create role',
        details: insertError.message 
      });
    }

    console.log('✅ New role created successfully:', newRole.id);
    res.json({ role: newRole });
  } catch (error) {
    console.error('💥 Server error during role creation:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Delete role endpoint
app.delete('/api/admin/roles/:roleId', checkAdminAccess, async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!roleId) {
      return res.status(400).json({ 
        error: 'Role ID is required' 
      });
    }

    console.log('🗑️ Role deletion request:', {
      roleId,
      timestamp: new Date().toISOString()
    });

    // Проверяем, не используется ли роль пользователями
    const { data: usersWithRole, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('role_id', roleId)
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking role usage:', checkError);
      return res.status(500).json({ 
        error: 'Failed to check role usage',
        details: checkError.message 
      });
    }

    if (usersWithRole && usersWithRole.length > 0) {
      return res.status(400).json({ 
        error: 'Нельзя удалить роль, которая назначена пользователям'
      });
    }

    const { error: deleteError } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId);

    if (deleteError) {
      console.error('❌ Role deletion error:', deleteError);
      return res.status(500).json({ 
        error: 'Failed to delete role',
        details: deleteError.message 
      });
    }

    console.log('✅ Role deleted successfully:', roleId);
    res.json({ success: true });
  } catch (error) {
    console.error('💥 Server error during role deletion:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Update user role endpoint
app.patch('/api/admin/users/:userId/role', checkAdminAccess, async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }

    console.log('👤 User role update request:', {
      userId,
      newRoleId: roleId,
      timestamp: new Date().toISOString()
    });

    // Если roleId не пустой, проверяем что роль существует
    if (roleId && roleId.trim() !== '') {
      const { data: roleExists, error: roleCheckError } = await supabase
        .from('roles')
        .select('id')
        .eq('id', roleId)
        .single();

      if (roleCheckError || !roleExists) {
        return res.status(400).json({ 
          error: 'Указанная роль не существует'
        });
      }
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        role_id: roleId && roleId.trim() !== '' ? roleId : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select(`
        id,
        telegram_id,
        username,
        first_name,
        last_name,
        language_code,
        role_id,
        roles(name, description, color),
        created_at,
        updated_at
      `)
      .single();

    if (updateError) {
      console.error('❌ User role update error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update user role',
        details: updateError.message 
      });
    }

    console.log('✅ User role updated successfully:', userId);
    console.log('👤 Updated user data:', {
      id: updatedUser.id,
      telegram_id: updatedUser.telegram_id,
      role_id: updatedUser.role_id,
      role_name: updatedUser.roles?.name
    });
    res.json({ user: updatedUser });
  } catch (error) {
    console.error('💥 Server error during user role update:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get content by role endpoint
app.get('/api/admin/content/:roleName', checkAdminAccess, async (req, res) => {
  try {
    const { roleName } = req.params;

    console.log('🔍 Admin content request:', {
      roleName,
      headers: req.headers,
      telegramId: req.headers['x-telegram-id'],
      timestamp: new Date().toISOString()
    });

    // Получаем посты (включая только что опубликованные)
    const { data: content, error } = await supabase
      .from('content')
      .select('*')
      .eq('role_name', roleName)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase content query error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch content from database',
        details: error.message
      });
    }

    // Получаем ссылки для всех постов
    if (content && content.length > 0) {
      const contentIds = content.map(item => item.id);
      const { data: links, error: linksError } = await supabase
        .from('content_links')
        .select('*')
        .in('content_id', contentIds)
        .order('created_at', { ascending: true });

      if (linksError) {
        console.error('❌ Supabase links query error:', linksError);
        return res.status(500).json({ 
          error: 'Failed to fetch links from database',
          details: linksError.message
        });
      }

      // Группируем ссылки по content_id
      const linksByContent = {};
      if (links) {
        links.forEach(link => {
          if (!linksByContent[link.content_id]) {
            linksByContent[link.content_id] = [];
          }
          linksByContent[link.content_id].push(link);
        });
      }

      // Объединяем посты с их ссылками
      const contentWithLinks = content.map(item => ({
        ...item,
        links: linksByContent[item.id] || []
      }));

      console.log(`📊 Found ${contentWithLinks.length} content items with links for role: ${roleName}`);
      res.json({ content: contentWithLinks });
    } else {
      console.log(`📊 Found 0 content items for role: ${roleName}`);
      res.json({ content: [] });
    }
  } catch (error) {
    console.error('💥 Server error in content:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Create content endpoint
app.post('/api/admin/content', checkAdminAccess, async (req, res) => {
  try {
    const { role_name, title, description, links, is_scheduled, scheduled_at, status } = req.body;

    if (!role_name || typeof role_name !== 'string' || role_name.trim() === '') {
      return res.status(400).json({ 
        error: 'Role name is required' 
      });
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ 
        error: 'Title is required' 
      });
    }

    if (!links || !Array.isArray(links) || links.length === 0) {
      return res.status(400).json({ 
        error: 'At least one link is required' 
      });
    }

    // Валидация ссылок
    for (const link of links) {
      if (!link.link_type || !['article', 'stream'].includes(link.link_type)) {
        return res.status(400).json({ 
          error: 'Invalid link type. Must be "article" or "stream"' 
        });
      }
      if (!link.link_title || typeof link.link_title !== 'string' || link.link_title.trim() === '') {
        return res.status(400).json({ 
          error: 'Link title is required' 
        });
      }
      if (!link.link_url || typeof link.link_url !== 'string' || link.link_url.trim() === '') {
        return res.status(400).json({ 
          error: 'Link URL is required' 
        });
      }
    }

    // Валидация времени планирования
    if (is_scheduled && scheduled_at) {
      const scheduledTime = new Date(scheduled_at);
      const now = new Date();
      
      if (isNaN(scheduledTime.getTime())) {
        return res.status(400).json({ 
          error: 'Invalid scheduled date format' 
        });
      }
      
      if (scheduledTime <= now) {
        return res.status(400).json({ 
          error: 'Scheduled time must be in the future' 
        });
      }
    }

    console.log('📝 Content creation request:', {
      role_name: role_name.trim(),
      title: title.trim(),
      description: description?.trim() || null,
      links: links,
      is_scheduled,
      scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : null,
      status,
      timestamp: new Date().toISOString()
    });

    // Создаем пост с базовыми полями
    const postData = {
      role_name: role_name.trim(),
      title: title.trim(),
      description: description?.trim() || null
    };

    // Добавляем поля планирования только если они переданы
    if (is_scheduled !== undefined && is_scheduled === true) {
      postData.is_scheduled = true;
      postData.scheduled_at = scheduled_at || null;
      postData.status = status || 'scheduled';
      // Не устанавливаем published_at для запланированных постов
    } else {
      // Для обычного поста устанавливаем значения по умолчанию
      postData.is_scheduled = false;
      postData.scheduled_at = null;
      postData.status = status || 'published';
      postData.published_at = new Date().toISOString();
    }

    const { data: newContent, error: insertError } = await supabase
      .from('content')
      .insert(postData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Content creation error:', insertError);
      return res.status(500).json({ 
        error: 'Failed to create content',
        details: insertError.message 
      });
    }

    // Создаем ссылки
    const linksToInsert = links.map(link => ({
      content_id: newContent.id,
      link_type: link.link_type,
      link_title: link.link_title.trim(),
      link_url: link.link_url.trim()
    }));

    const { data: newLinks, error: linksError } = await supabase
      .from('content_links')
      .insert(linksToInsert)
      .select();

    if (linksError) {
      console.error('❌ Links creation error:', linksError);
      // Удаляем созданный пост если не удалось создать ссылки
      await supabase.from('content').delete().eq('id', newContent.id);
      return res.status(500).json({ 
        error: 'Failed to create links',
        details: linksError.message 
      });
    }

    // Формируем полный ответ с ссылками
    const fullContent = {
      ...newContent,
      links: newLinks || []
    };

    console.log('✅ New content created successfully:', newContent.id);
    res.json({ content: fullContent });
  } catch (error) {
    console.error('💥 Server error during content creation:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Update content endpoint
app.patch('/api/admin/content/:contentId', checkAdminAccess, async (req, res) => {
  try {
    const { contentId } = req.params;
    const { title, description, links, is_scheduled, scheduled_at, status } = req.body;

    if (!contentId) {
      return res.status(400).json({ 
        error: 'Content ID is required' 
      });
    }

    // Валидация времени планирования при обновлении
    if (is_scheduled && scheduled_at) {
      const scheduledTime = new Date(scheduled_at);
      const now = new Date();
      
      if (isNaN(scheduledTime.getTime())) {
        return res.status(400).json({ 
          error: 'Invalid scheduled date format' 
        });
      }
      
      if (scheduledTime <= now) {
        return res.status(400).json({ 
          error: 'Scheduled time must be in the future' 
        });
      }
    }

    console.log('✏️ Content update request:', {
      contentId,
      title,
      description,
      links,
      is_scheduled,
      scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : null,
      status,
      timestamp: new Date().toISOString()
    });

    // Обновляем основной пост
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (is_scheduled !== undefined) updateData.is_scheduled = Boolean(is_scheduled);
    if (scheduled_at !== undefined) updateData.scheduled_at = scheduled_at;
    if (status !== undefined) updateData.status = status;
    
    // Если пост становится запланированным, сбрасываем published_at
    if (is_scheduled === true) {
      updateData.published_at = null;
    }
    
    // Если пост становится опубликованным, устанавливаем published_at
    if (status === 'published' && is_scheduled === false) {
      updateData.published_at = new Date().toISOString();
      updateData.scheduled_at = null;
      updateData.is_scheduled = false;
    }

    const { data: updatedContent, error: updateError } = await supabase
      .from('content')
      .update(updateData)
      .eq('id', contentId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Content update error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update content',
        details: updateError.message 
      });
    }

    // Если переданы ссылки, обновляем их
    if (links && Array.isArray(links)) {
      // Удаляем все существующие ссылки
      const { error: deleteError } = await supabase
        .from('content_links')
        .delete()
        .eq('content_id', contentId);

      if (deleteError) {
        console.error('❌ Links deletion error:', deleteError);
        return res.status(500).json({ 
          error: 'Failed to delete existing links',
          details: deleteError.message 
        });
      }

      // Создаем новые ссылки
      if (links.length > 0) {
        const linksToInsert = links.map(link => ({
          content_id: contentId,
          link_type: link.link_type,
          link_title: link.link_title.trim(),
          link_url: link.link_url.trim()
        }));

        const { data: newLinks, error: linksError } = await supabase
          .from('content_links')
          .insert(linksToInsert)
          .select();

        if (linksError) {
          console.error('❌ Links creation error:', linksError);
          return res.status(500).json({ 
            error: 'Failed to create new links',
            details: linksError.message 
          });
        }

        // Формируем полный ответ с ссылками
        const fullContent = {
          ...updatedContent,
          links: newLinks || []
        };

        console.log('✅ Content and links updated successfully:', contentId);
        res.json({ content: fullContent });
        return;
      }
    }

    // Если ссылки не переданы, возвращаем обновленный пост без ссылок
    console.log('✅ Content updated successfully:', contentId);
    res.json({ content: updatedContent });
  } catch (error) {
    console.error('💥 Server error during content update:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Delete content endpoint
app.delete('/api/admin/content/:contentId', checkAdminAccess, async (req, res) => {
  try {
    const { contentId } = req.params;

    if (!contentId) {
      return res.status(400).json({ 
        error: 'Content ID is required' 
      });
    }

    console.log('🗑️ Content deletion request:', {
      contentId,
      timestamp: new Date().toISOString()
    });

    const { error: deleteError } = await supabase
      .from('content')
      .delete()
      .eq('id', contentId);

    if (deleteError) {
      console.error('❌ Content deletion error:', deleteError);
      return res.status(500).json({ 
        error: 'Failed to delete content',
        details: deleteError.message 
      });
    }

    console.log('✅ Content deleted successfully:', contentId);
    res.json({ success: true });
  } catch (error) {
    console.error('💥 Server error during content deletion:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get user content by telegram ID endpoint
app.get('/api/user/content/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;

    if (!telegramId) {
      return res.status(400).json({ 
        error: 'Telegram ID is required' 
      });
    }

    console.log('🔍 User content request:', {
      telegramId,
      status: req.query.status,
      timestamp: new Date().toISOString()
    });

    // Сначала получаем роль пользователя
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        role_id,
        roles(name)
      `)
      .eq('telegram_id', parseInt(telegramId))
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') { // User not found
        return res.json({ content: [], userRole: '' });
      }
      console.error('❌ User lookup error:', userError);
      return res.status(500).json({ 
        error: 'Failed to find user',
        details: userError.message
      });
    }

    const userRole = user?.roles?.name || '';

    if (!userRole || userRole.trim() === '') {
      return res.json({ content: [], userRole: '' });
    }

    // Получаем контент для роли пользователя с фильтрацией
    let contentQuery = supabase
      .from('content')
      .select('*')
      .eq('role_name', userRole);

    // Фильтруем по статусу, если передан параметр
    const { status } = req.query;
    if (status === 'published') {
      // Показываем только опубликованные посты или посты без статуса (обратная совместимость)
      contentQuery = contentQuery.or('status.eq.published,status.is.null');
    }

    // Дополнительная фильтрация запланированных постов
    // Показываем посты только если они не запланированы ИЛИ время публикации уже наступило
    const now = new Date().toISOString();
    contentQuery = contentQuery.or(`is_scheduled.eq.false,is_scheduled.is.null,scheduled_at.is.null,scheduled_at.lte.${now}`);

    const { data: content, error: contentError } = await contentQuery.order('created_at', { ascending: false });

    if (contentError) {
      console.error('❌ Content query error:', contentError);
      return res.status(500).json({ 
        error: 'Failed to fetch content',
        details: contentError.message
      });
    }

    // Дополнительная фильтрация на уровне приложения для большей точности
    const filteredContent = content ? content.filter(item => {
      // Если пост не запланирован, показываем его
      if (!item.is_scheduled) return true;
      
      // Если пост запланирован, но время публикации наступило, показываем его
      if (item.scheduled_at && new Date(item.scheduled_at) <= new Date()) return true;
      
      // Иначе скрываем запланированный пост
      return false;
    }) : [];

    // Получаем ссылки для всех отфильтрованных постов
    if (filteredContent && filteredContent.length > 0) {
      const contentIds = filteredContent.map(item => item.id);
      const { data: links, error: linksError } = await supabase
        .from('content_links')
        .select('*')
        .in('content_id', contentIds)
        .order('created_at', { ascending: true });

      if (linksError) {
        console.error('❌ Supabase links query error:', linksError);
        return res.status(500).json({ 
          error: 'Failed to fetch links from database',
          details: linksError.message
        });
      }

      // Группируем ссылки по content_id
      const linksByContent = {};
      if (links) {
        links.forEach(link => {
          if (!linksByContent[link.content_id]) {
            linksByContent[link.content_id] = [];
          }
          linksByContent[link.content_id].push(link);
        });
      }

      // Объединяем посты с их ссылками
      const contentWithLinks = filteredContent.map(item => ({
        ...item,
        links: linksByContent[item.id] || []
      }));

      console.log(`📊 Found ${contentWithLinks.length} content items with links for user role: ${userRole} (filtered by status: ${status || 'all'})`);
      res.json({ 
        content: contentWithLinks, 
        userRole: userRole 
      });
    } else {
      console.log(`📊 Found 0 content items for user role: ${userRole}`);
      res.json({ 
        content: [], 
        userRole: userRole 
      });
    }
  } catch (error) {
    console.error('💥 Server error in user content:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Auto-publish scheduled posts endpoint
app.post('/api/admin/content/auto-publish', checkAdminAccess, async (req, res) => {
  try {
    console.log('🔄 Manual auto-publish request...');
    
    const publishedCount = await autoPublishOverduePosts();
    
    if (publishedCount === 0) {
      return res.json({ 
        message: 'No overdue posts found',
        published: 0,
        posts: []
      });
    }

    // Получаем обновленные посты для возврата клиенту
    const { data: publishedPosts, error } = await supabase
      .from('content')
      .select('*')
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .gte('published_at', new Date(Date.now() - 60000).toISOString()) // посты опубликованные за последнюю минуту
      .order('published_at', { ascending: false });

    res.json({ 
      message: 'Posts published successfully',
      published: publishedCount,
      posts: publishedPosts || []
    });

  } catch (error) {
    console.error('💥 Server error during manual auto-publish:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test auto-publish endpoint (без авторизации для отладки)
app.post('/api/test/auto-publish', async (req, res) => {
  try {
    console.log('🧪 Test auto-publish request...');
    
    const publishedCount = await autoPublishOverduePosts();
    
    res.json({ 
      message: 'Test auto-publish completed',
      published: publishedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Test auto-publish error:', error);
    res.status(500).json({ 
      error: 'Test auto-publish failed',
      details: error.message
    });
  }
});

// Debug scheduled posts endpoint (без авторизации для отладки)
app.get('/api/test/scheduled-posts', async (req, res) => {
  try {
    console.log('🔍 Debug scheduled posts request...');
    
    const now = new Date();
    
    // Получаем все запланированные посты
    const { data: allScheduledPosts, error: debugError } = await supabase
      .from('content')
      .select('*')
      .eq('is_scheduled', true)
      .not('scheduled_at', 'is', null);
    
    if (debugError) {
      return res.status(500).json({ error: 'Failed to fetch scheduled posts', details: debugError.message });
    }
    
    // Получаем просроченные посты
    const { data: overduePosts, error: findError } = await supabase
      .from('content')
      .select('*')
      .eq('status', 'scheduled')
      .eq('is_scheduled', true)
      .not('scheduled_at', 'is', null)
      .lte('scheduled_at', now.toISOString());
    
    if (findError) {
      return res.status(500).json({ error: 'Failed to find overdue posts', details: findError.message });
    }
    
    const debugInfo = {
      current_time: now.toISOString(),
      moscow_time: now.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
      total_scheduled: allScheduledPosts?.length || 0,
      overdue_count: overduePosts?.length || 0,
      scheduled_posts: allScheduledPosts?.map(post => ({
        id: post.id,
        title: post.title,
        role_name: post.role_name,
        status: post.status,
        scheduled_at: post.scheduled_at,
        scheduled_moscow: new Date(post.scheduled_at).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
        is_overdue: new Date(post.scheduled_at) <= now,
        seconds_overdue: new Date(post.scheduled_at) <= now ? Math.floor((now.getTime() - new Date(post.scheduled_at).getTime()) / 1000) : null
      })) || [],
      overdue_posts: overduePosts?.map(post => ({
        id: post.id,
        title: post.title,
        role_name: post.role_name,
        scheduled_at: post.scheduled_at,
        seconds_overdue: Math.floor((now.getTime() - new Date(post.scheduled_at).getTime()) / 1000)
      })) || []
    };
    
    res.json(debugInfo);

  } catch (error) {
    console.error('💥 Debug scheduled posts error:', error);
    res.status(500).json({ 
      error: 'Debug failed',
      details: error.message
    });
  }
});

// Assign admin role endpoint
app.post('/api/admin/assign-admin', checkAdminAccess, async (req, res) => {
  try {
    const { telegramId } = req.body;

    if (!telegramId) {
      return res.status(400).json({ 
        error: 'Telegram ID is required' 
      });
    }

    console.log('👑 Admin role assignment request:', {
      telegramId,
      timestamp: new Date().toISOString()
    });

    // Получаем ID роли "admin"
    const { data: adminRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'admin')
      .single();

    if (roleError || !adminRole) {
      return res.status(500).json({ 
        error: 'Admin role not found. Please ensure the admin role exists in the database.'
      });
    }

    // Проверяем, существует ли пользователь
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('telegram_id', parseInt(telegramId))
      .single();

    if (userError || !user) {
      return res.status(404).json({ 
        error: 'User not found with the specified Telegram ID'
      });
    }

    // Назначаем роль "admin" пользователю
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        role_id: adminRole.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select(`
        id,
        telegram_id,
        username,
        first_name,
        last_name,
        language_code,
        role_id,
        roles(name, description, color),
        created_at,
        updated_at
      `)
      .single();

    if (updateError) {
      console.error('❌ Admin role assignment error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to assign admin role',
        details: updateError.message 
      });
    }

    console.log('✅ Admin role assigned successfully to user:', user.id);
    console.log('👑 Updated user data:', {
      id: updatedUser.id,
      telegram_id: updatedUser.telegram_id,
      role_id: updatedUser.role_id,
      role_name: updatedUser.roles?.name
    });
    res.json({ 
      message: 'Admin role assigned successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('💥 Server error during admin role assignment:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// API endpoint для получения настроек приложения
app.get('/api/settings', async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('app_settings')
      .select('*')
      .order('key');

    if (error) {
      console.error('❌ Error fetching settings:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch settings',
        details: error.message 
      });
    }

    res.json({ 
      settings: settings || [] 
    });
  } catch (error) {
    console.error('💥 Server error during settings fetch:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// API endpoint для обновления настроек (только для админов)
app.put('/api/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const telegramId = req.headers['x-telegram-id'];

    if (!telegramId) {
      return res.status(401).json({ 
        error: 'Telegram ID required' 
      });
    }

    // Проверяем, является ли пользователь администратором
    const isAdmin = await checkIfUserIsAdmin(parseInt(telegramId));
    if (!isAdmin) {
      return res.status(403).json({ 
        error: 'Admin access required' 
      });
    }

    if (!value) {
      return res.status(400).json({ 
        error: 'Value is required' 
      });
    }

    const { data: updatedSetting, error } = await supabase
      .from('app_settings')
      .update({ 
        value,
        updated_at: new Date().toISOString()
      })
      .eq('key', key)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating setting:', error);
      return res.status(500).json({ 
        error: 'Failed to update setting',
        details: error.message 
      });
    }

    console.log('✅ Setting updated successfully:', { key, value });
    res.json({ 
      message: 'Setting updated successfully',
      setting: updatedSetting
    });
  } catch (error) {
    console.error('💥 Server error during setting update:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// API endpoint для получения цен тарифов
app.get('/api/tariff-prices', async (req, res) => {
  try {
    console.log('🔍 Tariff prices request:', {
      timestamp: new Date().toISOString()
    });

    const { data: prices, error } = await supabase
      .from('tariff_prices')
      .select('*')
      .order('tariff_index', { ascending: true });

    if (error) {
      console.error('❌ Error fetching tariff prices:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch tariff prices',
        details: error.message 
      });
    }

    console.log('✅ Tariff prices fetched successfully:', prices?.length || 0);
    res.json({ 
      prices: prices || [] 
    });
  } catch (error) {
    console.error('💥 Server error during tariff prices fetch:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// API endpoint для обновления цен тарифов (только для админов)
app.put('/api/admin/tariff-prices', checkAdminAccess, async (req, res) => {
  try {
    const { prices } = req.body;
    const telegramId = req.headers['x-telegram-id'];

    if (!prices || !Array.isArray(prices)) {
      return res.status(400).json({ 
        error: 'Prices array is required' 
      });
    }

    console.log('💰 Tariff prices update request:', {
      pricesCount: prices.length,
      telegramId,
      timestamp: new Date().toISOString()
    });

    // Валидация данных
    for (const price of prices) {
      if (!price.tariff_key || !price.title || !price.price || !price.original_price) {
        return res.status(400).json({ 
          error: 'Each price must have tariff_key, title, price, and original_price' 
        });
      }
      
      if (typeof price.tariff_index !== 'number' || price.tariff_index < 0) {
        return res.status(400).json({ 
          error: 'tariff_index must be a non-negative number' 
        });
      }
    }

    // Обновляем цены в транзакции
    const updatedPrices = [];
    
    for (const priceData of prices) {
      const { data: updatedPrice, error } = await supabase
        .from('tariff_prices')
        .update({
          title: priceData.title,
          price: priceData.price,
          original_price: priceData.original_price,
          description: priceData.description || null,
          updated_at: new Date().toISOString()
        })
        .eq('tariff_key', priceData.tariff_key)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating tariff price:', error);
        return res.status(500).json({ 
          error: 'Failed to update tariff price',
          details: error.message 
        });
      }

      updatedPrices.push(updatedPrice);
    }

    console.log('✅ Tariff prices updated successfully:', updatedPrices.length);
    res.json({ 
      message: 'Tariff prices updated successfully',
      prices: updatedPrices
    });
  } catch (error) {
    console.error('💥 Server error during tariff prices update:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Serve static files (both in development and production)
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  res.sendFile(path.join(__dirname, '../dist/index.html'), (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Error loading application');
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`⏰ Auto-publish scheduler: Every hour (3600 seconds)`);
  console.log(`📅 Scheduled posts will be automatically published when their time comes`);
  console.log(`📊 Admin endpoint: http://localhost:${PORT}/api/admin/users`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📁 Static files served from: ${path.join(__dirname, '../dist')}`);
});

export default app;
