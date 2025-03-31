import sqlite3
import os
import random
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_NAME = os.path.join(BASE_DIR, "database.db")

def get_db_connection():
    conn = sqlite3.connect(DB_NAME, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def create_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        parent_id INTEGER,
        current INTEGER DEFAULT 0,
        comment TEXT DEFAULT '',
        completed_at DATETIME DEFAULT NULL,
        started_at DATETIME DEFAULT NULL,
        priority INTEGER DEFAULT 1,
        FOREIGN KEY (parent_id) REFERENCES tasks (id)
    );""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS calendar_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        notes TEXT,
        all_day INTEGER DEFAULT 0,
        FOREIGN KEY (task_id) REFERENCES tasks (id)
    );""")

    conn.commit()
    conn.close()

def seed_data():
    conn = get_db_connection()
    cursor = conn.cursor()

    main_tasks = ['Планирование проекта', 'Дизайн и проектирование', 'Разработка (Coding)', 'Тестирование', 'Развертывание']
    subtasks = {
        'Разработка (Coding)': ['Frontend', 'Backend', 'API-интеграция', 'Документация', 'Оптимизация'],
        'Backend': ['Архитектура', 'База данных', 'Бизнес-логика', 'Аутентификация', 'Логирование'],
        'База данных': ['Выбор СУБД', 'Создание схемы', 'Миграции', 'Оптимизация запросов', 'Хранимые процедуры']
    }

    task_ids = {}

    cursor.execute("INSERT INTO tasks (parent_id, content, current) VALUES (?, ?, 1)", (None, 'Разработка ПО'))
    task_ids['Разработка ПО'] = cursor.lastrowid

    for mt in main_tasks:
        cursor.execute("INSERT INTO tasks (parent_id, content, current) VALUES (?, ?, ?)",
                       (task_ids['Разработка ПО'], mt, 1))
        task_ids[mt] = cursor.lastrowid

    for parent, children in subtasks.items():
        for child in children:
            parent_id = task_ids.get(parent, task_ids['Разработка (Coding)'])
            completed_at = datetime.now() if random.random() < 0.8 else None
            cursor.execute("INSERT INTO tasks (parent_id, content, completed_at) VALUES (?, ?, ?)",
                           (parent_id, child, completed_at))
            task_ids[child] = cursor.lastrowid

    # Дополнительные случайные задачи до 100
    for i in range(len(task_ids) + 1, 101):
        parent_id = random.choice(list(task_ids.values()))
        completed_at = datetime.now() if random.random() < 0.8 else None
        task_name = f"Доп. задача {i}"
        cursor.execute("INSERT INTO tasks (parent_id, content, completed_at) VALUES (?, ?, ?)",
                       (parent_id, task_name, completed_at))
        task_ids[task_name] = cursor.lastrowid

    # Генерация расписания на 2 недели
    today = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
    end_date = today + timedelta(days=14)

    working_hours_per_day = [(9, 12), (13, 17)]
    current_day = today
    task_list = list(task_ids.values())

    while current_day < end_date:
        if current_day.weekday() < 5:  # Пн-Пт
            for start_hour, end_hour in working_hours_per_day:
                task_id = random.choice(task_list)
                start_time = current_day.replace(hour=start_hour)
                end_time = current_day.replace(hour=end_hour)
                cursor.execute("""
                    INSERT INTO calendar_tasks (task_id, start_date, end_date, notes, all_day) 
                    VALUES (?, ?, ?, ?, ?)
                """, (task_id, start_time.isoformat(), end_time.isoformat(), 'Автосгенерировано', 0))
        current_day += timedelta(days=1)

    conn.commit()
    conn.close()

def init_db():
    if not os.path.exists(DB_NAME):
        print("📂 Создание новой базы данных...")
        create_db()
        seed_data()
        print("✅ База данных успешно создана и заполнена задачами!")

def update_database():

    pass

def backup_database():

    pass

if __name__ == "__main__":
    init_db()
