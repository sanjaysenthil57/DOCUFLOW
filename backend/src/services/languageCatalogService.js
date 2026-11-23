const { ProgrammingLanguage } = require('../models');

const OFFICIAL_LANGUAGES = [
  {
    name: 'c',
    displayName: 'C (GCC)',
    category: 'Systems & Cloud',
    fileExtension: '.c',
    version: 'GCC 11',
    executionCommand: 'gcc',
    description: 'Low-level imperative systems programming language for operating systems, embedded systems, and core data structures.',
    defaultBoilerplate: `#include <stdio.h>\n\nint main() {\n    printf("Kongu Engineering College - MCA Department\\n");\n    return 0;\n}\n`
  },
  {
    name: 'cpp',
    displayName: 'C++ 17 (G++)',
    category: 'Systems & Cloud',
    fileExtension: '.cpp',
    version: 'G++ 17',
    executionCommand: 'g++',
    description: 'Object-oriented, generic, and functional systems language used for high-performance computing, DSA, and game development.',
    defaultBoilerplate: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    cout << "Advanced Data Structures & Algorithms (C++17)" << endl;\n    return 0;\n}\n`
  },
  {
    name: 'java',
    displayName: 'Java 17 (LTS)',
    category: 'General Purpose',
    fileExtension: '.java',
    version: 'OpenJDK 17',
    executionCommand: 'javac / java',
    description: 'Class-based, object-oriented enterprise platform language powering backend services, Android, and distributed enterprise applications.',
    defaultBoilerplate: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        System.out.println("Java Enterprise Systems & Applications");\n    }\n}\n`
  },
  {
    name: 'python',
    displayName: 'Python 3.10',
    category: 'Data Science & Analytics',
    fileExtension: '.py',
    version: '3.10.11',
    executionCommand: 'python',
    description: 'High-level interpreted language leading AI, Machine Learning, Data Science, Scripting, and Rapid Backend Development.',
    defaultBoilerplate: `# Python 3 MCA Lab Implementation\nimport sys\n\ndef main():\n    print("DocuFlow AI Academic Lab - Python")\n\nif __name__ == "__main__":\n    main()\n`
  },
  {
    name: 'javascript',
    displayName: 'JavaScript (Node.js)',
    category: 'Web & Scripting',
    fileExtension: '.js',
    version: 'Node.js 20',
    executionCommand: 'node',
    description: 'Dynamic, multi-paradigm runtime language powering modern full-stack web applications, frontends, and event-driven backends.',
    defaultBoilerplate: `// Full Stack Web Development - JavaScript\nconsole.log("Modern Full Stack Web Applications");\n`
  },
  {
    name: 'typescript',
    displayName: 'TypeScript',
    category: 'Web & Scripting',
    fileExtension: '.ts',
    version: '5.0',
    executionCommand: 'ts-node',
    description: 'Strict syntactical superset of JavaScript adding static typing, interfaces, and compile-time correctness for large enterprise codebases.',
    defaultBoilerplate: `interface CourseModule {\n    code: string;\n    credits: number;\n}\n\nconst mca: CourseModule = { code: "26MCT21", credits: 4 };\nconsole.log(mca);\n`
  },
  {
    name: 'php',
    displayName: 'PHP 8.2',
    category: 'Web & Scripting',
    fileExtension: '.php',
    version: '8.2',
    executionCommand: 'php',
    description: 'Server-side web scripting language widely deployed for content management systems, REST APIs, and dynamic web portals.',
    defaultBoilerplate: `<?php\necho "PHP Server-side Scripting & Web Engineering\\n";\n`
  },
  {
    name: 'sql',
    displayName: 'SQL (RDBMS / PostgreSQL)',
    category: 'Database & Query',
    fileExtension: '.sql',
    version: 'ANSI SQL:2016',
    executionCommand: 'psql / sqlite3',
    description: 'Standard declarative query language for relational database management, schema design, complex joins, and transactional processing.',
    defaultBoilerplate: `-- SQL Database Laboratory Query\nSELECT student_id, name, semester FROM students WHERE department = 'MCA';\n`
  },
  {
    name: 'html',
    displayName: 'HTML5',
    category: 'Web & Scripting',
    fileExtension: '.html',
    version: 'HTML5',
    executionCommand: 'browser',
    description: 'Standard semantic markup language structuring modern web documents, multimedia presentations, and user interfaces.',
    defaultBoilerplate: `<!DOCTYPE html>\n<html lang="en">\n<head><title>Web Development</title></head>\n<body><h1>MCA Web Technologies</h1></body>\n</html>\n`
  },
  {
    name: 'css',
    displayName: 'CSS3',
    category: 'Web & Scripting',
    fileExtension: '.css',
    version: 'CSS3',
    executionCommand: 'browser',
    description: 'Cascading style sheets defining layouts, visual styles, flexbox/grid architecture, and animations for responsive web UI.',
    defaultBoilerplate: `body {\n    font-family: system-ui, sans-serif;\n    background-color: #0f172a;\n    color: #f8fafc;\n}\n`
  },
  {
    name: 'r',
    displayName: 'R (Statistical Computing)',
    category: 'Data Science & Analytics',
    fileExtension: '.r',
    version: '4.2',
    executionCommand: 'Rscript',
    description: 'Specialized programming language and statistical environment for data visualization, hypothesis testing, and bio-informatics.',
    defaultBoilerplate: `# R Statistical Analysis\ndata <- c(85, 90, 78, 92, 88)\ncat("Mean Score:", mean(data), "\\n")\n`
  },
  {
    name: 'go',
    displayName: 'Go (Golang)',
    category: 'Systems & Cloud',
    fileExtension: '.go',
    version: '1.21',
    executionCommand: 'go run',
    description: 'Fast, statically typed compiled language designed at Google for concurrent microservices, distributed cloud systems, and DevOps tooling.',
    defaultBoilerplate: `package main\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Cloud Computing & Distributed Systems in Go")\n}\n`
  },
  {
    name: 'rust',
    displayName: 'Rust',
    category: 'Systems & Cloud',
    fileExtension: '.rs',
    version: '1.72',
    executionCommand: 'rustc',
    description: 'Memory-safe systems programming language without garbage collection, excelling at high-performance concurrency, WebAssembly, and secure tooling.',
    defaultBoilerplate: `fn main() {\n    println!("Memory-safe Systems Engineering with Rust");\n}\n`
  },
  {
    name: 'kotlin',
    displayName: 'Kotlin (JVM / Android)',
    category: 'Mobile Development',
    fileExtension: '.kt',
    version: '1.9',
    executionCommand: 'kotlinc',
    description: 'Modern concise multiplatform language official for Android development, server-side development, and multiplatform mobile applications.',
    defaultBoilerplate: `fun main() {\n    println("Mobile Application Development with Kotlin")\n}\n`
  },
  {
    name: 'swift',
    displayName: 'Swift',
    category: 'Mobile Development',
    fileExtension: '.swift',
    version: '5.9',
    executionCommand: 'swift',
    description: 'Apple modern compiled language engineered for iOS, macOS, watchOS, and cross-platform native application development.',
    defaultBoilerplate: `import Foundation\nprint("Native iOS Application Development with Swift")\n`
  },
  {
    name: 'csharp',
    displayName: 'C# (.NET Core)',
    category: 'General Purpose',
    fileExtension: '.cs',
    version: '.NET 8',
    executionCommand: 'dotnet run',
    description: 'Modern, object-oriented language developed by Microsoft for web APIs, cloud microservices, Unity game development, and desktop apps.',
    defaultBoilerplate: `using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("C# Enterprise Application Architecture");\n    }\n}\n`
  },
  {
    name: 'ruby',
    displayName: 'Ruby',
    category: 'Web & Scripting',
    fileExtension: '.rb',
    version: '3.2',
    executionCommand: 'ruby',
    description: 'Dynamic, open source programming language with a focus on developer happiness, simplicity, and rapid web prototyping via Rails.',
    defaultBoilerplate: `puts "Ruby Scripting and Web Architecture"\n`
  },
  {
    name: 'dart',
    displayName: 'Dart (Flutter)',
    category: 'Mobile Development',
    fileExtension: '.dart',
    version: '3.2',
    executionCommand: 'dart run',
    description: 'Client-optimized language for fast apps on any platform, powering multi-platform mobile, web, and desktop development with Flutter.',
    defaultBoilerplate: `void main() {\n  print('Cross-Platform Mobile Development with Dart & Flutter');\n}\n`
  },
  {
    name: 'matlab',
    displayName: 'MATLAB / Octave',
    category: 'Data Science & Analytics',
    fileExtension: '.m',
    version: 'R2023b',
    executionCommand: 'octave',
    description: 'Proprietary multi-paradigm programming language and numeric computing environment used in matrix manipulation, engineering simulation, and DSP.',
    defaultBoilerplate: `% MATLAB / Octave Engineering Computing\nA = [1, 2; 3, 4];\ndisp('Determinant:');\ndisp(det(A));\n`
  },
  {
    name: 'scala',
    displayName: 'Scala 3',
    category: 'General Purpose',
    fileExtension: '.scala',
    version: '3.3',
    executionCommand: 'scala',
    description: 'Object-oriented and functional language running on the JVM, famous for Apache Spark big data analytics and concurrent akka actors.',
    defaultBoilerplate: `@main def main(): Unit = {\n  println("Big Data Processing & Functional Scala")\n}\n`
  },
  {
    name: 'bash',
    displayName: 'Bash / Linux Shell',
    category: 'Systems & Cloud',
    fileExtension: '.sh',
    version: 'Bash 5.2',
    executionCommand: 'bash',
    description: 'Unix shell command language essential for server automation, DevOps deployment pipelines, Docker containers, and CI/CD workflows.',
    defaultBoilerplate: `#!/usr/bin/env bash\necho "DevOps Automation & Shell Scripting Pipeline"\n`
  },
  {
    name: 'assembly',
    displayName: 'Assembly (x86_64 / NASM)',
    category: 'Systems & Cloud',
    fileExtension: '.asm',
    version: 'NASM 2.15',
    executionCommand: 'nasm',
    description: 'Low-level mnemonic representation of machine architecture instructions for understanding computer hardware, CPU registers, and reverse engineering.',
    defaultBoilerplate: `section .data\n    msg db "Assembly Hardware Architecture", 0xA\n    len equ $ - msg\nsection .text\n    global _start\n_start:\n    mov rax, 1\n    mov rdi, 1\n    mov rsi, msg\n    mov rdx, len\n    syscall\n    mov rax, 60\n    xor rdi, rdi\n    syscall\n`
  }
];

/**
 * Ensures all 22 official programming languages are present in the MongoDB database.
 */
async function syncLanguageCatalog() {
  const results = [];
  for (const lang of OFFICIAL_LANGUAGES) {
    const existing = await ProgrammingLanguage.findOne({ name: lang.name });
    if (!existing) {
      const created = await ProgrammingLanguage.create({ ...lang, isActive: true });
      results.push(created);
    } else {
      // Keep displayName, category, and execution command updated
      existing.displayName = lang.displayName;
      existing.category = lang.category;
      existing.version = lang.version;
      existing.fileExtension = lang.fileExtension;
      existing.executionCommand = lang.executionCommand;
      existing.description = lang.description;
      if (!existing.defaultBoilerplate) {
        existing.defaultBoilerplate = lang.defaultBoilerplate;
      }
      await existing.save();
      results.push(existing);
    }
  }
  return results;
}

module.exports = {
  OFFICIAL_LANGUAGES,
  syncLanguageCatalog
};
