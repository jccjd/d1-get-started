import { Hono } from 'hono'
import { jsxRenderer } from 'hono/jsx-renderer'
import { FC } from 'hono/jsx'

// 定义环境变两类型 (D1 数据库)
type Bindings = {
  DB: D1Database
}

// 定义 Todo 数据类型
type Todo = {
  id: number
  title: string
  completed: number
}

const app = new Hono<{ Bindings: Bindings }>()

// ==========================================
// 🎨 1. UI 组件 (类似 React 组件，但运行在服务器)
// ==========================================

// 布局组件
const Layout: FC = (props) => {
  return (
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Hono D1 Todo</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-100 min-h-screen py-10 px-4">
        <div class="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-lg p-6">
          {props.children}
        </div>
      </body>
    </html>
  )
}

// 首页组件
const TodoPage: FC<{ todos: Todo[] }> = ({ todos }) => {
  return (
    <Layout>
      <h1 class="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span>⚡</span> Hono + D1 待办清单
      </h1>

      {/* 添加表单 */}
      <form action="/add" method="POST" class="flex gap-2 mb-8">
        <input
          type="text"
          name="title"
          placeholder="添加新任务..."
          required
          class="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          添加
        </button>
      </form>

      {/* 任务列表 */}
      <ul class="space-y-3">
        {todos.map((todo) => (
          <li class="flex items-center justify-between p-3 bg-slate-50 rounded-lg group hover:bg-slate-100 transition">
            <div class="flex items-center gap-3">
              {/* 完成/未完成切换表单 */}
              <form action={`/toggle/${todo.id}`} method="POST">
                <button
                  type="submit"
                  class={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                    todo.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-slate-300 hover:border-blue-500'
                  }`}
                >
                  {todo.completed ? '✓' : ''}
                </button>
              </form>
              
              <span class={todo.completed ? 'text-slate-400 line-through' : 'text-slate-700'}>
                {todo.title}
              </span>
            </div>

            {/* 删除表单 */}
            <form action={`/delete/${todo.id}`} method="POST">
              <button type="submit" class="text-slate-400 hover:text-red-500 transition px-2">
                ✕
              </button>
            </form>
          </li>
        ))}
        {todos.length === 0 && (
          <p class="text-center text-slate-400 py-4">暂无任务，享受生活吧！🎉</p>
        )}
      </ul>
    </Layout>
  )
}

// ==========================================
// 🚀 2. 后端路由逻辑
// ==========================================

// 首页：读取数据并渲染
app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM todos ORDER BY created_at DESC'
  ).run<Todo>()
  
  // 这里的 results 自动拥有 Todo[] 类型，这就是 TS 的爽点
  return c.html(<TodoPage todos={results} />)
})

// 添加任务
app.post('/add', async (c) => {
  const body = await c.req.parseBody()
  const title = body['title'] as string

  if (title) {
    await c.env.DB.prepare('INSERT INTO todos (title) VALUES (?)')
      .bind(title)
      .run()
  }
  return c.redirect('/')
})

// 切换完成状态
app.post('/toggle/:id', async (c) => {
  const id = c.req.param('id')
  // 先查当前状态，取反更新
  // 注意：SQL逻辑可以在这里优化，但为了演示清晰分两步
  const todo = await c.env.DB.prepare('SELECT completed FROM todos WHERE id = ?').bind(id).first<Todo>()
  
  if (todo) {
    const newStatus = todo.completed ? 0 : 1
    await c.env.DB.prepare('UPDATE todos SET completed = ? WHERE id = ?')
      .bind(newStatus, id)
      .run()
  }
  return c.redirect('/')
})

// 删除任务
app.post('/delete/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM todos WHERE id = ?').bind(id).run()
  return c.redirect('/')
})

export default app
