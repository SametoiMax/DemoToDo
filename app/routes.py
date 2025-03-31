from flask import render_template, request, redirect, flash, Flask, jsonify
from app.database import get_db_connection
import subprocess
from datetime import datetime

app = Flask(__name__)


def format_task_datetime(dt):
    if not dt:
        return None
    try:
        return datetime.strptime(dt, "%Y-%m-%d %H:%M:%S.%f").strftime("%d.%m.%y %H:%M")
    except ValueError:
        try:
            return datetime.strptime(dt, "%Y-%m-%d %H:%M:%S").strftime("%d.%m.%y %H:%M")
        except ValueError:
            return None


def get_last_commit_time():
    try:
        output = subprocess.check_output(["git", "log", "-1", "--format=%cd", "--date=format:%d.%m.%Y %H:%M"]).decode(
            "utf-8").strip()
        return output.strip()
    except subprocess.CalledProcessError:
        return "неизвестно"


def get_git_version():
    try:
        version = subprocess.check_output(["git", "describe", "--tags", "--abbrev=0"], universal_newlines=True).strip()
        return f"{version}"
    except Exception:
        return "v1.5"


APP_VERSION = get_git_version()
last_commit_time = get_last_commit_time()


def build_task_tree(tasks):
    task_dict = {}
    for task in tasks:
        task = dict(task)
        task["subtasks"] = []
        task["parent_done"] = False
        task_dict[task["id"]] = task
    root_tasks = []
    for task in task_dict.values():
        parent_id = task["parent_id"]
        if parent_id:
            parent_task = task_dict.get(parent_id)
            if parent_task:
                parent_task["subtasks"].append(task)
        else:
            root_tasks.append(task)
    for task in task_dict.values():
        task['all_subtasks_done'] = all(sub['completed_at'] for sub in task['subtasks'])
    return root_tasks


def flatten_task_tree(task_list, depth=0):
    sorted_list = []
    for task in sorted(task_list, key=lambda x: x["id"]):
        task["depth"] = depth
        sorted_list.append(task)
        sorted_list.extend(flatten_task_tree(task["subtasks"], depth + 1))
    return sorted_list


def compute_task_depth(tasks):
    task_dict = {task['id']: dict(task) for task in tasks}
    for task in task_dict.values():
        task['depth'] = 0
    for task in task_dict.values():
        parent_id = task['parent_id']
        while parent_id:
            if parent_id in task_dict:
                task['depth'] += 1
                parent_id = task_dict[parent_id]['parent_id']
            else:
                break
    return list(task_dict.values())


def filter_tasks_by_completion(tasks):
    task_dict = {task["id"]: dict(task) for task in tasks}

    def is_task_completed(task_id):
        while task_id:
            if task_id not in task_dict:
                return False
            if task_dict[task_id]["completed_at"]:
                return True
            task_id = task_dict[task_id]["parent_id"]
        return False

    return [task for task in tasks if not is_task_completed(task["id"])]


class Print:
    pass


def register_routes(app):
    @app.route('/')
    def index():
        conn = get_db_connection()
        tasks = conn.execute("""
            SELECT * FROM tasks
            ORDER BY 
                CASE WHEN completed_at IS NULL THEN 0 ELSE 1 END,
                completed_at DESC, COALESCE(parent_id, id), id
        """).fetchall()
        conn.close()
        formatted_tasks = []
        for task in tasks:
            task = dict(task)
            task["started_at"] = format_task_datetime(task["started_at"])
            task["completed_at"] = format_task_datetime(task["completed_at"])
            formatted_tasks.append(task)
        all_tasks = build_task_tree(formatted_tasks)
        available_tasks = filter_tasks_by_completion(formatted_tasks)
        root_tasks = build_task_tree(available_tasks)
        available_tasks = flatten_task_tree(root_tasks)
        current_task = next((task for task in formatted_tasks if task["current"] == 1), None)
        current_task_id = current_task["id"] if current_task else 0
        selected_parent = request.args.get("selected_parent", default=None, type=int)

        return render_template(
            'index.html',
            tasks=all_tasks,
            all_tasks=available_tasks,
            current_task_id=current_task_id,
            last_commit_time=last_commit_time,
            version=APP_VERSION,
            selected_parent=selected_parent
        )

    @app.route('/set_current/<int:task_id>', methods=['GET'])
    def set_current_task(task_id):
        conn = get_db_connection()
        try:
            conn.execute("UPDATE tasks SET current = 0 WHERE current = 1")
            conn.execute("UPDATE tasks SET current = 1, started_at = ? WHERE id = ?", (datetime.now(), task_id))
            conn.commit()
            print(f"Обновление текущей задачи: {datetime.now()}")
        except Exception as e:
            print(f"Ошибка при обновлении текущей задачи: {e}")
        finally:
            conn.close()
        return redirect('/')

    @app.route('/add', methods=['POST'])
    def add_task():
        content = request.form['content'].strip()
        parent_id = request.form.get('parent_id')
        if not content:
            flash("Нельзя добавлять пустые задачи!", "error")
            return redirect('/')
        parent_id = int(parent_id) if parent_id else None
        conn = get_db_connection()
        try:
            conn.execute("INSERT INTO tasks (content, parent_id) VALUES (?, ?)", (content, parent_id))
            conn.commit()
        except Exception as e:
            flash(f"Ошибка при добавлении задачи: {str(e)}", "error")
        finally:
            conn.close()
        return redirect(f'/?selected_parent={parent_id}' if parent_id else '/')

    @app.route('/done/<int:task_id>')
    def mark_done(task_id):
        conn = get_db_connection()
        try:
            task = conn.execute("SELECT completed_at FROM tasks WHERE id = ?", (task_id,)).fetchone()
            if task['completed_at']:
                conn.execute("UPDATE tasks SET completed_at = NULL WHERE id = ?", (task_id,))
            else:
                conn.execute("UPDATE tasks SET completed_at = datetime('now', 'localtime') WHERE id = ?", (task_id,))
            conn.commit()
        except Exception as e:
            flash(f"Ошибка при изменении статуса задачи: {e}", "error")
        finally:
            conn.close()
        return redirect('/')

    @app.route('/delete/<int:task_id>', methods=['GET'])
    def delete_task(task_id):
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM tasks WHERE parent_id = ?", (task_id,))
            subtask_count = cursor.fetchone()[0]
            if subtask_count > 0:
                flash("Нельзя удалить родительскую задачу, пока есть подзадачи!", "error")
            else:
                cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
                conn.commit()
        except Exception as e:
            flash(f"Ошибка при удалении задачи: {str(e)}", "error")
        finally:
            conn.close()
        return redirect('/')

    @app.route('/edit/<int:task_id>', methods=['GET', 'POST'])
    def edit_task(task_id):
        conn = get_db_connection()
        if request.method == 'POST':
            new_content = request.form['content'].strip()
            new_comment = request.form.get('comment', '').strip()
            new_parent_id = request.form.get('parent_id')
            new_parent_id = int(new_parent_id) if new_parent_id else None
            if not new_content:
                flash("Задача не может быть пустой!", "error")
                return redirect(f'/edit/{task_id}')
            try:
                conn.execute("UPDATE tasks SET content = ?, comment = ?, parent_id = ? WHERE id = ?",
                             (new_content, new_comment, new_parent_id, task_id))
                conn.commit()
            except Exception as e:
                flash(f"Ошибка при редактировании задачи: {str(e)}", "error")
            finally:
                conn.close()
            return redirect('/')
        try:
            task = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
            all_tasks = conn.execute("SELECT * FROM tasks WHERE id != ? ORDER BY COALESCE(parent_id, id), id",
                                     (task_id,)).fetchall()
            all_tasks = [dict(row) for row in all_tasks]
            all_tasks = compute_task_depth(all_tasks)
            all_tasks = filter_tasks_by_completion(all_tasks)
        except Exception as e:
            flash(f"Ошибка при загрузке задачи: {str(e)}", "error")
            task = None
            all_tasks = []
        finally:
            conn.close()
        return render_template('edit_task.html', task=task, all_tasks=all_tasks)

    @app.route('/set_priority/<int:task_id>', methods=['POST'])
    def set_priority(task_id):
        priority_str = request.form.get('priority', '1')
        try:
            priority = int(priority_str)
            if priority not in [1, 2, 3]:
                priority = 1
        except ValueError:
            priority = 1
        conn = get_db_connection()
        try:
            conn.execute("UPDATE tasks SET priority = ? WHERE id = ?", (priority, task_id))
            conn.commit()
        except Exception as e:
            flash(f"Ошибка при обновлении приоритета: {e}", "error")
        finally:
            conn.close()
        return ("", 200)

    @app.route('/move_task/<int:task_id>', methods=['POST'])
    def move_task(task_id):
        new_parent = request.args.get('new_parent')
        if new_parent == str(task_id):
            return jsonify({"error": "Нельзя назначить родителем саму себя"}), 400
        try:
            parent_id = int(new_parent) if new_parent and new_parent.isdigit() else None
        except ValueError:
            return jsonify({"error": f"Некорректный new_parent: {new_parent}"}), 400
        conn = get_db_connection()
        try:
            if parent_id is not None:
                row = conn.execute("SELECT id FROM tasks WHERE id=?", (parent_id,)).fetchone()
                if not row:
                    return jsonify({"error": f"Задача {parent_id} не существует в базе"}), 400
            conn.execute("UPDATE tasks SET parent_id=? WHERE id=?", (parent_id, task_id))
            conn.commit()
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()
        return jsonify({"status": "ok"})

    @app.route('/add_date/<int:task_id>', methods=['POST'])
    def add_date(task_id):
        start_date = request.form.get('start_date')
        end_date = request.form.get('end_date')
        all_day = request.form.get('all_day', '0')
        conn = get_db_connection()
        try:
            cursor = conn.cursor()  # Создайте курсор для работы с запросами
            cursor.execute(
                "INSERT INTO calendar_tasks (task_id, start_date, end_date, all_day) VALUES (?, ?, ?, ?)",
                (task_id, start_date, end_date, all_day)
            )
            conn.commit()

            last_id = cursor.lastrowid  # Получаем id последней вставленной записи

            # Теперь извлекаем подробности о добавленной задаче, как в /calendar_events
            cursor.execute("""
                SELECT ct.id,
                       ct.task_id, 
                       t.content AS title,
                       ct.start_date AS start,
                       ct.end_date AS end,
                       ct.all_day,
                       t.completed_at AS task_end_date,  -- Добавляем поле end_date из таблицы tasks
                       t.current,  -- Добавляем поле current из таблицы tasks
                       t.priority  -- Добавляем поле priority из таблицы tasks
                FROM calendar_tasks ct
                JOIN tasks t ON ct.task_id = t.id
                WHERE ct.id = ?
            """, (last_id,))
            row = cursor.fetchone()
            print(1)
            if row:
                # Устанавливаем статус на "completed", если поле task_end_date заполнено
                status = "completed" if row["task_end_date"] else "pending"
                # Устанавливаем текущую задачу, если поле current равно 1
                current_status = "current" if row["current"] == 1 else "not_current"

                # Добавляем значок 🎯 для текущей задачи
                title = "🎯 " + row["title"] if row["current"] == 1 else row["title"]  # Добавляем значок в название

                print(row)
                # Возвращаем данные о событии, аналогичные тому, как это делается в /calendar_events
                return jsonify({
                    "id": last_id,
                    "taskId": row["task_id"],
                    "title": title,
                    "start": row["start"],
                    "end": row["end"],
                    "allDay": (row["all_day"] == 1),
                    "status": status,
                    "current": current_status,  # Добавляем признак текущей задачи
                    "priority": row["priority"]  # Добавляем приоритет
                })

        except Exception as e:
            print(f"Error during database operation: {e}")
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()

    @app.route('/calendar_events')
    def calendar_events():
        print("calendar_events")
        conn = get_db_connection()
        try:
            # Запрашиваем данные, включая поля current и priority из таблицы tasks
            rows = conn.execute("""
                SELECT ct.id,
                       ct.task_id, 
                       t.content AS title,
                       ct.start_date AS start,
                       ct.end_date AS end,
                       ct.all_day,
                       t.completed_at AS task_end_date,  -- Добавляем поле end_date из таблицы tasks
                       t.current,  -- Добавляем поле current из таблицы tasks
                       t.priority  -- Добавляем поле priority из таблицы tasks
                FROM calendar_tasks ct
                JOIN tasks t ON ct.task_id = t.id
            """).fetchall()

            events_list = []
            for row in rows:
                # Устанавливаем статус на "completed", если поле task_end_date заполнено
                status = "completed" if row["task_end_date"] else "pending"
                # Устанавливаем текущую задачу, если поле current равно 1
                current_status = "current" if row["current"] == 1 else "not_current"

                # Добавляем значок 🎯 для текущей задачи
                title = "🎯 " + row["title"] if row["current"] == 1 else row["title"]  # Добавляем значок в название

                events_list.append({
                    "id": row["id"],
                    "taskId": row["task_id"],
                    "title": title,
                    "start": row["start"],
                    "end": row["end"],
                    "allDay": (row["all_day"] == 1),
                    "status": status,
                    "current": current_status,  # Добавляем признак текущей задачи
                    "priority": row["priority"]  # Добавляем приоритет
                })

            return jsonify(events_list)

        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()

    @app.route('/update_calendar_event/<int:event_id>', methods=['POST'])
    def update_calendar_event(event_id):
        start_date = request.form.get('start_date')
        end_date = request.form.get('end_date')
        all_day_b = request.form.get('all_day', '0')
        all_day = 1 if all_day_b in ['1', 'true'] else 0
        if not start_date or not end_date:
            return jsonify({"error": "start_date и end_date обязательны"}), 400
        conn = get_db_connection()
        try:
            conn.execute("""
                UPDATE calendar_tasks
                SET start_date = ?, end_date = ?, all_day = ?
                WHERE id = ?
            """, (start_date, end_date, all_day, event_id))
            conn.commit()
            return jsonify({"status": "ok"})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()

    @app.route('/delete_calendar_event/<int:event_id>', methods=['POST'])
    def delete_calendar_event(event_id):
        conn = get_db_connection()
        try:
            conn.execute("DELETE FROM calendar_tasks WHERE id = ?", (event_id,))
            conn.commit()
            return jsonify({"status": "ok"})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()

    @app.route("/some_route")
    def some_route():
        return "Tasks processed"