export interface User {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  language_code: string | null;
  role: string; // Название роли для отображения
  role_id?: string | null; // ID роли для API
  avatar?: string | null;
  created_at: string;
  updated_at: string;
  first_login_at?: string | null; // Дата первой авторизации
  last_login_at?: string | null;  // Дата последнего захода
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface RolesResponse {
  roles: Role[];
  total: number;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface ContentLink {
  id: string;
  content_id: string;
  link_type: 'article' | 'stream';
  link_title: string;
  link_url: string;
  created_at: string;
  updated_at: string;
}

export interface Content {
  id: string;
  role_name: string;
  title: string;
  description: string | null;
  article_link: string | null; // Устаревшее поле, оставляем для обратной совместимости
  stream_link: string | null;  // Устаревшее поле, оставляем для обратной совместимости
  links: ContentLink[];        // Новое поле для множественных ссылок
  is_scheduled: boolean;       // Флаг запланированного поста
  scheduled_at: string | null; // Время публикации для запланированного поста
  published_at: string | null; // Время фактической публикации
  status: 'draft' | 'scheduled' | 'published'; // Статус поста
  created_at: string;
  updated_at: string;
}

export interface ContentResponse {
  content: Content[];
}

export interface CreateContentRequest {
  role_name: string;
  title: string;
  description?: string;
  links: Array<{
    link_type: 'article' | 'stream';
    link_title: string;
    link_url: string;
  }>;
  is_scheduled?: boolean;
  scheduled_at?: string;
  status?: 'draft' | 'scheduled' | 'published';
}

export interface UpdateContentRequest {
  title?: string;
  description?: string;
  links?: Array<{
    id?: string; // ID для существующих ссылок
    link_type: 'article' | 'stream';
    link_title: string;
    link_url: string;
  }>;
  status?: 'draft' | 'scheduled' | 'published';
  is_scheduled?: boolean;
  scheduled_at?: string;
}

export interface CreateUserRequest {
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
}

export interface CreateUserResponse {
  user: User;
  isNew: boolean;
}

export interface AppSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppSettingsResponse {
  settings: AppSetting[];
}

export interface UpdateSettingRequest {
  value: string;
}
