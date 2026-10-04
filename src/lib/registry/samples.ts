// src/lib/registry/samples.ts

export const samples = {
    json: {
        simple: `{ "name": "Ali", "age": 28 }`,
        complex: `{ "userId": "u_123", "profile": { "firstName": "Sara" }, "roles": ["user"] }`,
    },
    css: {
        simple: `.button { color: red; }`,
        complex: `.card { background: white; border-radius: 8px; }`,
    },
    html: {
        simple: `<div class="container"><h1>Hello World</h1></div>`,
        complex: `<div class="page"><header>Logo</header><main><p>Welcome!</p></main></div>`,
    },
    svg: {
        simple: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /></svg>`,
        complex: `<svg viewBox="0 0 200 100"><rect width="200" height="100" fill="#2563eb" /><text x="20" y="55">ZebraCode</text></svg>`,
    },
    graphql: {
        simple: `query { user(id: "1") { name } }`,
        complex: `query GetPost($id: ID!) { post(id: $id) { title, author { name } } }`,
    },
    javascript: {
        simple: `const greet = (name) => \`Hello, \${name}!\`;`,
        complex: `async function fetchUser(id) { const res = await fetch(\`/api/users/\${id}\`); return res.json(); }`,
    },
    typescript: {
        simple: `interface User { name: string; age: number; }`,
        complex: `type ApiResponse<T> = { data: T; success: boolean; };`,
    },
    flow: {
        simple: `type User = { name: string, age: number };`,
        complex: `function greet(user: User): string { return \`Hello, \${user.name}\`; }`,
    },
    jsonld: {
        simple: `{"@context":"https://schema.org","@type":"Person","name":"Sara"}`,
        complex: `{"@context":"https://schema.org","@type":"Article","headline":"Developer Tools","author":{"@type":"Person","name":"Sara"}}`,
    },
    yaml: {
        simple: `name: ZebraCode
version: 1`,
        complex: `server:
  host: localhost
  port: 3000
features:
  - formatter
  - converter`,
    },
    toml: {
        simple: `name = "ZebraCode"
version = 1`,
        complex: `[server]
host = "localhost"
port = 3000

[features]
enabled = ["formatter", "converter"]`,
    },
    xml: {
        simple: `<user><name>Sara</name><age>28</age></user>`,
        complex: `<catalog><item id="1"><name>Developer Tools</name><tags><tag>JSON</tag><tag>XML</tag></tags></item></catalog>`,
    },
    markdown: {
        simple: `# ZebraCode

Free developer tools.`,
        complex: `# Release Notes

## Features

- JSON formatting
- Data conversion

Visit [ZebraCode](https://zebracode.ir).`,
    },
    scss: {
        simple: `$primary: #2563eb;
.button { color: $primary; }`,
        complex: `$spacing: 8px;
.card {
  padding: $spacing * 2;
  .title { font-weight: 700; }
}`,
    },
    go: {
        simple: `package main

func main() {}`,
        complex: `package main

import "fmt"

type User struct {
    Name string
    Age  int
}

func main() { fmt.Println(User{Name: "Sara", Age: 28}) }`,
    },
    sql: {
        simple: `SELECT id, name FROM users WHERE active = true;`,
        complex: `CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP
);`,
    },
    java: {
        simple: `public class User { String name; }`,
        complex: `public class User {
    private final String name;
    public User(String name) { this.name = name; }
    public String getName() { return name; }
}`,
    },
    rust: {
        simple: `struct User { name: String, age: u32 }`,
        complex: `fn main() {
    let user = User { name: String::from("Sara"), age: 28 };
    println!("{}", user.name);
}`,
    },
    scala: {
        simple: `case class User(name: String, age: Int)`,
        complex: `object Main extends App {
  val users = List("Sara", "Ali")
  users.foreach(name => println(name))
}`,
    },
    text: {
        simple: 'Sample plain text for conversion.',
        complex: `Line 1: This is a sample text.\nLine 2: Used for format conversions.`,
    },
};