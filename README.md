# Subscription Monitor

Кроссплатформенное приложение для управления подписками

## 🚀 Функционал

- ✅ Регистрация и авторизация пользователей
- ✅ Управление подписками (CRUD)
- ✅ Автоматический импорт из email
- ✅ Аналитика расходов с графиками
- ✅ Прогнозирование затрат
- ✅ Уведомления о платежах
- ✅ Синхронизация между web и mobile

## 🛠 Технологии

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT аутентификация
- Socket.io для real-time
- IMAP для парсинга почты

### Web
- React 18
- Material-UI
- Chart.js
- React Router

### Mobile
- React Native
- Expo
- React Native Paper
- React Navigation

## 📦 Установка и запуск

### Через Docker (рекомендуется)
```bash
# Клонировать репозиторий
git clone https://github.com/yourusername/subscription-monitor.git
cd subscription-monitor

# Запустить все сервисы
docker-compose up -d

# Остановить все сервисы
docker-compose down