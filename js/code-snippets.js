// Multi-Language Code Snippet Library for Coding Practice Mode

export const CODE_LANGUAGES = {
  sql: {
    id: 'sql',
    name: 'SQL',
    icon: '🗄️',
    description: 'ฝึกพิมพ์คำสั่งฐานข้อมูล SELECT, JOIN, WHERE, GROUP BY, INSERT และ INDEX',
    snippets: [
      'SELECT u.id, u.name, COUNT(o.id) AS total_orders\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nWHERE o.status = "COMPLETED"\nGROUP BY u.id\nORDER BY total_orders DESC\nLIMIT 10;',

      'CREATE TABLE employees (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  first_name VARCHAR(50) NOT NULL,\n  salary DECIMAL(10, 2) DEFAULT 0.00,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);',

      'UPDATE products\nSET stock = stock - 1, updated_at = NOW()\nWHERE id = 42 AND stock > 0;',

      'INSERT INTO customers (name, email, is_active)\nVALUES ("John Doe", "john@example.com", true)\nON DUPLICATE KEY UPDATE is_active = true;',

      'SELECT dept_id, AVG(salary) AS avg_sal\nFROM salaries\nGROUP BY dept_id\nHAVING avg_sal >= 50000\nORDER BY avg_sal DESC;'
    ]
  },

  c_cpp: {
    id: 'c_cpp',
    name: 'C / C++',
    icon: '⚙️',
    description: 'ฝึกพิมพ์ Pointers (*, ->), Structs, Header files, printf และ Memory management',
    snippets: [
      '#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',

      'int binary_search(int arr[], int n, int target) {\n    int low = 0, high = n - 1;\n    while (low <= high) {\n        int mid = low + (high - low) / 2;\n        if (arr[mid] == target) return mid;\n        else if (arr[mid] < target) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}',

      'typedef struct Node {\n    int data;\n    struct Node *next;\n} Node;\n\nNode* create_node(int val) {\n    Node *n = (Node*)malloc(sizeof(Node));\n    n->data = val;\n    n->next = NULL;\n    return n;\n}',

      '#include <iostream>\n#include <vector>\n#include <algorithm>\n\nint main() {\n    std::vector<int> nums = {4, 2, 7, 1, 9};\n    std::sort(nums.begin(), nums.end());\n    for (const auto &n : nums) std::cout << n << " ";\n    return 0;\n}'
    ]
  },

  html: {
    id: 'html',
    name: 'HTML',
    icon: '🌐',
    description: 'ฝึกพิมพ์แท็กเปิด-ปิด < >, Attributes, Semantic tags, Forms และ Layout elements',
    snippets: [
      '<header class="navbar">\n  <a href="/" class="brand-logo">AppLogo</a>\n  <nav class="nav-links">\n    <a href="/docs">Docs</a>\n    <a href="/pricing">Pricing</a>\n  </nav>\n</header>',

      '<form action="/api/login" method="POST">\n  <label for="email">Email Address</label>\n  <input type="email" id="email" name="email" required placeholder="user@mail.com" />\n  <button type="submit" class="btn btn-primary">Sign In</button>\n</form>',

      '<section class="card-grid">\n  <article class="card" data-id="101">\n    <img src="/avatar.jpg" alt="User avatar" />\n    <h3 class="card-title">Modern Web Design</h3>\n    <p class="card-desc">Master touch typing to build fast apps.</p>\n  </article>\n</section>',

      '<table class="data-table">\n  <thead>\n    <tr><th>ID</th><th>Name</th><th>Status</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>1</td><td>Admin</td><td><span class="badge">Active</span></td></tr>\n  </tbody>\n</table>'
    ]
  },

  css: {
    id: 'css',
    name: 'CSS',
    icon: '🎨',
    description: 'ฝึกพิมพ์ Selectors (.class, #id), Flexbox, Grid, Pseudo-classes และ Properties',
    snippets: [
      '.container {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 1.5rem 2rem;\n}',

      '.btn-primary {\n  background: linear-gradient(135deg, #38bdf8, #3b82f6);\n  color: #ffffff;\n  border: none;\n  border-radius: 8px;\n  cursor: pointer;\n  transition: all 0.2s ease;\n}',

      '.grid-layout {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));\n  gap: 1.5rem;\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);\n}',

      '@media (max-width: 768px) {\n  .sidebar {\n    display: none;\n  }\n  .main-content {\n    width: 100%;\n    padding: 1rem;\n  }\n}'
    ]
  },

  java: {
    id: 'java',
    name: 'Java',
    icon: '☕',
    description: 'ฝึกพิมพ์ Classes, Public Static Void Main, Interfaces, Generics <T> และ Streams',
    snippets: [
      'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Touch typing is essential for devs!");\n    }\n}',

      'public class User {\n    private Long id;\n    private String username;\n\n    public User(Long id, String username) {\n        this.id = id;\n        this.username = username;\n    }\n    public String getUsername() { return username; }\n}',

      'List<String> names = users.stream()\n    .filter(u -> u.getAge() >= 18)\n    .map(User::getName)\n    .sorted()\n    .collect(Collectors.toList());',

      'public interface Repository<T, ID> {\n    Optional<T> findById(ID id);\n    List<T> findAll();\n    T save(T entity);\n    void deleteById(ID id);\n}'
    ]
  },

  python: {
    id: 'python',
    name: 'Python',
    icon: '🐍',
    description: 'ฝึกพิมพ์ def, List comprehensions, Dicts, f-strings, Exception handling',
    snippets: [
      'def find_max_subsequence(nums: list[int]) -> int:\n    max_sum = current = nums[0]\n    for x in nums[1:]:\n        current = max(x, current + x)\n        max_sum = max(max_sum, current)\n    return max_sum',

      'class DatabaseConnection:\n    def __init__(self, host: str, port: int = 5432):\n        self.host = host\n        self.port = port\n        self.is_connected = False\n\n    def connect(self) -> bool:\n        self.is_connected = True\n        return True',

      'active_users = [u["name"] for u in user_list if u.get("is_active") and u["score"] >= 80]\nprint(f"Found {len(active_users)} active top performers")',

      'try:\n    response = requests.get("https://api.github.com/users/octocat", timeout=5)\n    data = response.json()\nexcept requests.RequestException as err:\n    logger.error(f"Network error: {err}")'
    ]
  },

  javascript: {
    id: 'javascript',
    name: 'JavaScript / TS',
    icon: '⚡',
    description: 'ฝึกพิมพ์ Async/Await, Arrow functions, Destructuring, Promises และ Array methods',
    snippets: [
      'const debounce = (fn, delay = 300) => {\n  let timeoutId;\n  return (...args) => {\n    clearTimeout(timeoutId);\n    timeoutId = setTimeout(() => fn(...args), delay);\n  };\n};',

      'export async function fetchProfile(userId) {\n  const res = await fetch(`/api/users/${userId}`);\n  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);\n  const { data } = await res.json();\n  return data;\n}',

      'const stats = items.reduce((acc, { category, price }) => {\n  acc[category] = (acc[category] || 0) + price;\n  return acc;\n}, {});',

      'interface Config {\n  readonly apiKey: string;\n  timeoutMs?: number;\n  retries: number;\n}\nconst clientConfig: Config = { apiKey: "secret_token", retries: 3 };'
    ]
  },

  shell: {
    id: 'shell',
    name: 'Bash / Git',
    icon: '💻',
    description: 'ฝึกพิมพ์ Command Line, Git commands, Docker, NPM และ Terminal flags',
    snippets: [
      'git checkout -b feature/auth && git add . && git commit -m "feat: setup JWT login" && git push origin HEAD',

      'docker run -d --name postgres-db -e POSTGRES_PASSWORD=secret -p 5432:5432 -v pgdata:/var/lib/postgresql/data postgres:16-alpine',

      'npm install --save-dev typescript @types/react @types/node eslint prettier',

      'find ./src -type f -name "*.test.ts" -exec grep -l "describe" {} \\; | wc -l',

      'kubectl get pods -n production -l app=backend --field-selector=status.phase=Running'
    ]
  }
};
